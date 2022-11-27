<template>
    <div>{{title}}</div>
    <div class="fake">{{tip}}</div>
</template>

<script>
import { reactive,toRefs } from "vue"
export default {
    setup() {
        const state = reactive({
            title: 'hello vite!!',
            tip:'我基本成功地完成了一个vite的核心功能'
        })

        return {
            ...toRefs(state)
        }
    }
}
</script>

<style lang="scss" scoped>
// scoped功能还无法实现
$main-clor : blue;
// .fake {
//     color:$main-clor;
//     position: relative;
//     &::before{
//         content: '';
//         width: 2px;
//         height: 56px;
//         position: absolute;
//         background-color: red;
//     }
// }
</style>

<style lang="less" scoped>
// scoped功能还无法实现
@main-clor : blue;
.fake {
    color:@main-clor;
    position: relative;
    &::before{
        content: '';
        width: 2px;
        height: 56px;
        position: absolute;
        background-color: red;
    }
}
</style>