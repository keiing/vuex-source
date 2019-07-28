
let Vue;//vue的构造函数
const forEach = (obj, callback) => {
    // console.log(Object.keys(obj))
    Object.keys(obj).forEach(key => {
        callback(key, obj[key]);
    })
}

class ModuleCollection {
    constructor(options) {
        //1.格式化以下
        this.register([], options);
    }
    register(path, rootModule) {
        let newModule = {
            _raw: rootModule,
            _children: {},
            state: rootModule.state
        }
        //我先去给个路径列表,如果路径列表为空的话，就把根直接制为newModule这个对象
        if (path.length === 0) {//表示现在是空数组
            this.root = newModule
        } else { //[a]
            //更新_children
            //最后一项 [a,b,c]path[path.length-1]
            //path.slice(0,-1)出掉最后一项
            //reduce 如果数组为空 会传一个上一次的值，直接把传入的值返回
            let parent = path.slice(0, -1).reduce((root, current) => {
                return this.root._children[current]
            }, this.root);
            parent._children[path[path.length - 1]] = newModule
        }
        /*如果他第二次看他有没有儿子模块 看当前代码 Vuex.Store/rootModule下有没有modules
        * 如果有modules就相当于有儿子模块，就需要把这个模块注册到跟模块上
        所以我就再调用了，这个register方法、
        并且给他描述 根是空数组，里面有内容的话 [a],module
        并且重新创建一个 newModule 走了 if(path.length){}else{}的else 返回this.root
        */
        //把a b注册到跟模块上去 判断
        if (rootModule.modules) {
            forEach(rootModule.modules, (moduleName, module) => {
                this.register(path.concat(moduleName), module)
            })
        }
    }
}
//我需要递归树 将结果挂在到 getters mutations actions
const installModule = (store, state, path, rootModule) => {
    //先处理根模块的getters属性

    if (path.length > 0) { //子模块 把子模块的状态放到父模块上
        // [a] {age:10}
        // [a,c] {age:10,a:{x:1}}
        // { age: 10, a: { x: 1, c: { z: 1 } }, b: { y: 1 } }
        let parent = path.slice(0, -1).reduce((state, current) => {
            return state[current]
        }, state);
        //Vuex 是绑定 vue的
        Vue.set(parent, path[path.length - 1], rootModule.state)
    }

    let getters = rootModule._raw.getters;
    if (getters) { //给store增加了getters属性
        forEach(getters, (getterName, fn) => {
            Object.defineProperty(store.getters, getterName, {
                get: () => {
                    return fn(rootModule.state);
                }
            })
        })
    }
    let mutations = rootModule._raw.mutations;
    if (mutations) { //{syncAdd:[fn,fn]} 如果不存在 {syncAdd:[fn]}
        forEach(mutations, (mutationName, fn) => {
            let arr = store.mutations[mutationName] || (store.mutations[mutationName] = []);
            arr.push((payload) => {
                fn(rootModule.state, payload);
            })
        })
    }
    let actions = rootModule._raw.actions;
    if (actions) { //{syncAdd:[fn,fn]} 如果不存在 {syncAdd:[fn]}
        forEach(actions, (actionName, fn) => {
            let arr = store.actions[actionName] || (store.actions[actionName] = []);
            arr.push((payload) => {
                fn(store, payload);
            })
        })
    }

    forEach(rootModule._children, (moduleName, module) => {
        installModule(store, state, path.concat(moduleName), module)
    })
}
class Store {
    constructor(options) { //选项里就有state
        //1.不能这么简单 this.state = options.state 使用属性访问器 get state
        // this._state = options.state;//在选项中把state拿出来
        //2.new Vue({}) 添加get，set方法用于数据改变视图刷新
        this._state = new Vue({ /** 面试会问什么时候用到了newVue */
            data: {
                state: options.state //把对象变成了 可以监控的对象
            }
        })
        // let getters = options.getters || {};//用户传递过来的getters
        this.getters = {};
        //把getters属性定义到this.getters中，并且根据状态的变化 重新执行函数
        //简写1--如下
        // Object.keys(getters).forEach((getterName) => {
        //     Object.defineProperty(this.getters, getterName, {
        //         get: () => {
        //             console.log(getterName + "getterName 方法名", JSON.stringify(this.state) + "传的的数据仓库state", JSON.stringify(getters) + "getters定义的对象")
        //             return getters[getterName](this.state);
        //         }
        //     });
        // });
        //简写后1--
        // forEach(getters, (getterName, fn) => {
        //     Object.defineProperty(this.getters, getterName, {
        //         get: () => {
        //             console.log(getterName + "getterName 方法名", JSON.stringify(this.state) + "传的的数据仓库state", JSON.stringify(getters) + "getters定义的对象")
        //             return fn(this.state);
        //         }
        //     });
        // });
        //拿到用户传来的参数
        // let mutations = options.mutations || {}
        this.mutations = {};
        // Object.keys(mutations).forEach((mutationName) => {
        //     //先把用户传递过来的Mutation放到我们的store实例上
        //     this.mutations[mutationName] = (payload) => {
        //         //mutations[mutations] 要调用的函数
        //         mutations[mutationName](this.state, payload);//对应着要调用的函数 以及参数
        //     }
        // })
        // forEach(mutations, (mutationName, fn) => {
        //     //先把用户传递过来的Mutation放到我们的store实例上
        //     this.mutations[mutationName] = (payload) => {
        //         //mutations[mutations] 要调用的函数
        //         //希望mutations内部的this直接指向 
        //         // fn(this.state, payload);store可以使用call
        //         fn.call(this, this.state, payload);//对应着要调用的函数 以及参数
        //     }
        // });
        // let actions = options.actions || {};
        this.actions = {};
        // forEach(actions, (actionName, fn) => {
        //     this.actions[actionName] = (payload) => {
        //         //要修改这里的this指向 
        //         // fn(this, payload);
        //         fn.call(this, this, payload);
        //     }
        // });
        //方法2 会在内部新生，先把一个原型方法拿出来 commit没有写全
        // let { commit, dispatch } = this;
        // this.dispatch = () => { dispatch.call(this); }
        // commit = (type, payload) => {
        //     this.commit();
        // }





        //我需要先格式化以下用户传递过来的数据
        //1.收集模块
        this.modules = new ModuleCollection(options);
        console.log(this.modules, '----------------------')
        //root就是它的根 我希望通过他的根 把所有里面的mutations actions getters 都定义到store上去
        //this.$store 包含着 getters mutations
        //2.安装模块
        installModule(this, this.state, [], this.modules.root);//安装模块 //this指向当前的store实例
        /** 
        let root = {
            _raw: rootModule,
            state: { age: 18 },
            _children: {
                a: {
                    _raw: aModule,
                    _children: {},
                    state: { x: 1 }
                },
                b: {
                    _raw: builtinModules,
                    _children: {},
                    state: { y: 1 }
                }
            }
        }
        */
    }
    dispatch(type, payload) {
        //方法1.可以修改commit 把他改成箭头函数 commit=()=>{}
        // this.actions[type](payload);
        this.actions[type].forEach(fn => fn(payload))
    }
    commit = (type, payload) => {//类型 ，值
        // this.mutations[type](payload);
        this.mutations[type].forEach(fn => fn(payload));
    }
    get state() { //想要获取属性 就会调用这个方法
        return this._state.state;
    }

}
// vue的组件渲染 先渲染父组件 再渲染子组件 深度优先 是个递归 -> 
/*parent Render
    child Render
    child Did
  paretn did
*/
const install = (_Vue) => { //接收参数 install = (_Vue, abc)=>{console.log('install', abc);}
    //install 默认会被调用
    Vue = _Vue;
    //我需要给每个组件都注册一个this.$store属性
    Vue.mixin({ // [beforeCreate,beforeCreate]
        beforeCreate() { //生命周期 组件创建之前
            // console.log(this.$options.name); //拿到 vue的name 
            //需要先判别 是父组件 还是子组件，如果是子组件 应该吧父组件的store增加给子组件
            if (this.$options && this.$options.store) { //先判断是否有 $optons 在判断 是否有store
                this.$store = this.$options.store;
            } else { //走else就是子组件  
                // $parent 父亲
                //不已经有父亲 可能就是个new Vue
                this.$store = this.$parent && this.$parent.$store
            }
        }
    })
}

export default {
    install,
    Store
}
//后续知识
// namesapce 命名空间
// registerModule 如何动态注册 register模块
// store.subscribe() vuex 怎么去实现中间件