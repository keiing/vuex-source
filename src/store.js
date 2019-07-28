import Vue from 'vue'
import Vuex from './vuex'

Vue.use(Vuex);//用插件都会用use 会默认调用这个库的install方法
//还可以传入参数Vue.use(Vuex, 123)
export default new Vuex.Store({
  //我希望把一个项目分成很多模块 使用的递归
  modules: {
    a: {
      state: {
        x: 1
      },
      getters: {
        getA(state) {
          return state.x + 100 + "amodule";
        }
      },
      mutations: {
        syncAdd(state) {
          console.log('a-module')
        },
      },
      modules: {
        c: {
          state: {
            x: 2
          }
        }
      }
    },
    b: {
      state: {
        y: 2
      }
    },
  },
  state: {
    age: 18
  },
  getters: {
    myAge(state) {
      return state.age + 10
    },
    myName(state) {
      return state.age
    }
  },
  actions: {
    asyncMinus({ commit, dispatch }, payload) {
      setTimeout(() => {
        commit('syncMinus', payload);
      }, 1000);
    }
  },
  mutations: {
    syncMinus(state, payload) {
      state.age -= payload;
    },
    syncAdd(state, payload) {
      state.age += payload;
    }
  }
})
