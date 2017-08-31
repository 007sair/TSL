# TSL

全称：Tab-Scroll-Load，[预览地址](http://007sair.github.io/demo/TSL/index.html)

## 功能

- 选项卡切换
- 选项卡左右滑动（iscroll）
- 选项卡悬浮（sticky）
- 上滑加载（ajax）

## 使用方法

### `HTML:`

``` html
<div class="J_tabWrap">
    <div class="tsl-tab">
        <div class="J_iScroll">
            <ul>
                <li class="active">tab1</li>
                <li>tab2</li>
                ...
            </ul>
        </div>
    </div>
</div>

<div class="tsl-cont J_contWrap">
    <div class="cont cont-active"></div>
    <div class="cont"></div>
    ...
</div>
```

**注意：** `J_`开头的`className`，都是`js`需要使用的class，如果冲突，可在配置中进行修改。其他class可随意修改。

### `JS:`

``` javascript
new TSL({
    iScroll: '.J_iScroll',
    className: {
        //如果className有冲突，可以在这里重新定义
    },
    render: function(cb) {
        var me = this;
        //在这里写ajax，具体用法参考src/index.html，这里仅举例说明
        $.ajax({
            url: 'xxx.json',
            type: 'get',
            data: {},
            dataType: 'json',
            success: function (data) {
                renderList.call(me, data.data_list);
                //必须得有
                me.oCurTab.isRender = true;
                cb && cb();
            },
            error: function () {
                console.log('ajax error');
                me.reload();
            }
        });
    }
});

function renderList(arr) { // arr => ajax请求到的数据，一般为数组类型
    /*
        注意：此函数的this指向在调用时使用call，this指向TSL实例
        举个栗子：
        this.curTabIndex //当前tab索引值
        this.$contWrap //$('.J_contWrap');
        this.$cont.eq(this.curTabIndex) //$('.J_contWrap .cont').eq(this.curTabIndex);
        this.opts.className.items //'__items__';

        this的属性方法，请自行console
        参数配置信息，请参考下方API
     */
}
```

## API

```js
//调用方法
new TSL(options)
```

options的类型为对象，属性、方法如下：

### `options.isDisableAutoLoad`

类型：`Boolean`，是否禁用自动加载，默认不禁用

#### `options.startPage`

类型：`Number`，页面起始页数，默认值为1

**`options.iScroll`**

> 类型：`String`，默认值：'.J_iscroll'

iscroll插件引用的className，注意有个`.`

**`options.className`**

> 类型：`Object`

html中需要使用的className，如有冲突，可自行修改。

```js
{
    tabWrap: 'J_tabWrap',			//tab外层包裹容器样式名
    contWrap: 'J_contWrap',			//cont外层包裹容器样式名
    cont: 'cont',					//cont容器名，与html中的名称对应上
    contActive: 'cont-active', 		//选项卡切换时当前（显示）的样式名
    items: '__items__'				//cont容器内用来包裹数据的容器样式名，与__loading__并列
}
```

**`options.render(callback)`**

> 类型：`Function`

渲染函数，在页面滚动到底部及切换tab时触发。`callback`为回调函数

**`options.afterRender(callback)`**

> 类型：`Function`

`render`函数的`callback`执行时触发

**`options.tabClick($obj)`**

> 类型：`Function`

点击tab时触发，`$obj`为被点击的li元素，为jquery对象

**`options.scroll(scrollTop)`**

> 类型：`Function`

将`scroll`事件暴露到外面，`scrollTop`为当前滚动值

**`options.loading`**

> 类型：`Object`

TSL插件中单独使用了loading插件，配置如下：

```js
{
    styleID: '__loading_style__',   //(type:String) style标签的id属性
    className: '__loading__',       //(type:String) loading元素的className
    icon: 'xxx.png',                //(type:String) loading菊花图标，本插件使用base64
    size: 20,                       //(type:Number) loading大小，影响图标与字体大小
    multi: 2.5,                     //(type:Number) loading大小系数，影响图标的高度
    html: '<i></i><span>加载中, 请稍后...</span>' //(type:String)  loading文本内容
}
```
