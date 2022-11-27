// node服务器，处理浏览器各种加载资源的请求
const Koa = require("koa");
const consola = require("consola");
const fs = require("fs");
const path = require("path");
//解析sfc.
const compileSFC = require("@vue/compiler-sfc");
// 将template部分转为渲染函数
const compileDOM = require("@vue/compiler-dom");
// sass(scss编译)
const sassCompile = require("sass");
// less 编译
const lessCompile = require("less");

const app = new Koa();

app.use(async (ctx) => {
  //判断请求的url路径
  const { url, query } = ctx.request;
  if (url === "/") {
    const htmlPath = path.resolve(__dirname, "./index.html");
    const content = fs.readFileSync(htmlPath, "utf-8");
    ctx.type = "text/html";
    ctx.body = content;
  } else if (url.endsWith(".js")) {
    //js文件加载处理
    const relPath = path.join(__dirname, url);
    ctx.type = "application/javascript";
    const content = fs.readFileSync(relPath, "utf-8");
    ctx.body = rewriteImport(content);
  } else if (url.startsWith("/@modules/")) {
    //裸模块的名称
    const moduleName = url.replace("/@modules/", "");
    //去node_modules去找
    const prefix = path.join(__dirname, "../node_modules", moduleName);
    // package.json寻找 module字段
    const module = require(prefix + "/package.json").module;
    const filePath = path.join(prefix, module);
    const ret = fs.readFileSync(filePath, "utf8");
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(ret);
  } else if (url.indexOf(".vue") > -1 || url.indexOf(".vue.css") > -1) {
    // 先将.css 去掉
    let c_url = url;
    if (c_url.indexOf(".vue.css") > -1) {
      c_url = c_url.replace(/\.css/, "");
      if (!query) {
        query = {};
      }
      query.type = "style";
    }
    //这是一次sfc的请求
    //读取vue文件解析为js
    const relPath = path.join(__dirname, c_url.split("?")[0]);
    const ret = compileSFC.parse(fs.readFileSync(relPath, "utf8"));
    const stylesContent = ret.descriptor.styles;
    // template content:     script content:
    if (!query.type) {
      const scriptContent = ret.descriptor.script.content;
      const script = scriptContent.replace(
        "export default ",
        "const __script = "
      );
      ctx.type = "application/javascript";
      ctx.body = `
      ${rewriteImport(script)}
       // 解析styles (scss,less)
     ${
       stylesContent.length > 0
         ? `setTimeout(()=>{getVueCssFile('${c_url.replace(
             /\.vue/,
             ".vue.css"
           )}')},0)`
         : ""
     }
      //解析tpl
      import {render as __render} from '${c_url}?type=template'
     __script.render = __render
     export default __script
      `;
      // console.log(ret.descriptor.styles);
    } else if (query.type === "template") {
      const tpl = ret.descriptor.template.content;
      const render = compileDOM.compile(tpl, { mode: "module" }).code;
      ctx.type = "application/javascript";
      ctx.body = rewriteImport(render);
    } else if (query.type === "style") {
      const styleList = stylesContent.map(async (style) => {
        // const sc = style.content;
        let css = "";
        switch (style.lang) {
          case "scss":
          case "sass":
            css = sassCompile.compileString(style.content).css;
            break;
          case "less":
            css = (await lessCompile.render(style.content)).css;
            break;
          default:
            css = style.content;
        }
        // console.log(`lang==>${style.lang}`, css);
        return css; //返回值自动被Promise.resolve()包裹处理
        // return Promise.resolve(css); //由于外面使用了async，将返回一个Promise,只能这样了
      });

      ctx.type = "text/css";
      ctx.body = (await Promise.all(styleList)).join("\n").replace(/\n/, "");
    }
  }
});

//裸模块地址重写
// import xx from "vue"  ===> import xx from "@/modules/vue"

function rewriteImport(content) {
  return content.replace(/ from ['"](.*)['"]/g, function (s1, s2) {
    // console.log("s1====>", s1); // from "vue"
    // console.log("s2====>", s2); //vue
    if (s2.startsWith(".") || s2.startsWith("./") || s2.startsWith("../")) {
      return s1;
    } else {
      // 裸模块
      return ` from "/@modules/${s2}"`;
    }
  });
}

app.listen(3000, () => {
  consola.success("listen on 3000!");
});
