# 手写vite
## vite原理说明
这篇文章主要是为了我学习vite的相关原理而使用的，可以看到vite的核心就是构建一个服务器来实现对SFC的一个路径转换，以及找到node_modules下的esbuild编译好的文件，并返回它，仅此而已！
这里为了方便简单使用了koa来构建，需要了解真正的实现请自行阅读官方源码。
[源码地址，点击跳转](https://github.com/vitejs/vite)