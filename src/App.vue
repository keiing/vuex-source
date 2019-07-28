<template>
  <div id="app">
    我今年{{this.$store.state.age}}了
    <br />
    {{this.$store.getters.myAge}}
    {{this.$store.getters.myName}}
    <button
      v-on="{click:handleAdd}"
    >点击按钮 增加10岁</button>
    <button v-on="{click:minus}">异步 减的操作</button>
    {{this.$store.state.a.x}}
    {{this.$store.state.b.y}}
    <!-- {{this.$store.getters.getA}} -->
  </div>
</template>
<script>
import { setTimeout } from "timers";
export default {
  name: "app",
  methods: {
    handleAdd() {
      //调用 store 中的commit 中的 handleAdd方法
      this.$store.commit("syncAdd", 10);
    },
    minus() {
      this.$store.dispatch("asyncMinus", 10);
    }
  },
  mounted() {
    setTimeout(() => {
      console.log(this.$store);
      this.$store.state.age = 100;
    }, 1000);
  }
};
</script>
<style>
</style>
