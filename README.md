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
//调用
var tsl = new TSL({
    load: function() {
        var me = this;
        $.ajax({
            url: 'xxx',
            type: 'get',
            data: {
                page: me.oCurTab.page,
                tab: me.curTabIndex
            },
            dataType: 'json',
            success: function (res) {
                if (res.code == 1) { //成功
                    //渲染数据，传入数据、当前被渲染tab索引
                    me.render(res);
                } else { //其他状态
                    if (res.code == 0) { //全部加载完毕
                        me.fail('- 到底啦 -');
                    } else { //数据有误
                        me.fail('- 数据有误 -');
                        me.reload();
                    }
                }
                
            },
            error: function () {
                console.log('ajax error');
                me.reload();
            }
        });
    },
    render: function (res) { //渲染函数，res为this.render传入参数
        /*
        举个栗子：
        this.curTabIndex //当前tab索引值
        this.$items      //ajax加载的数据应被append到这个容器内
        this的属性方法，请自行console，参数配置信息，请参考下方API
         */
    }
});
```

## API

```js
var tsl = new TSL(options)
```

### tsl

tsl实例的属性与方法，请自行console或者查看源代码。

### options

#### `options.isDisableAutoLoad`

类型：`Boolean`，是否禁用自动加载，默认不禁用。

#### `options.isDisableScroll`

类型：`Boolean`，是否禁用上滑加载，默认不禁用，为`true`时，`options.scroll`函数也会失效。

#### `options.defaultTabIndex`

类型：`Number`，页面默认tab位置，默认从第一个开始

#### `options.startPage`

类型：`Number`，页面起始页数，默认值为1。

#### `options.iScroll`

类型：`String`or`null`，iscroll插件引用的className，注意有个`.`，默认值：'.J_iScroll'，禁用`iscroll`直接等于`null`即可。

#### `options.className`

类型：`Object`，html中需要使用的className，如有冲突，可自行修改。

```js
{
    tabWrap: 'J_tabWrap',			//tab外层容器样式
    tabActive: 'tab-active',		//tab选中样式
    tabTag: 'li',					//tab点击元素标签名
    contWrap: 'J_contWrap',			//cont外层包裹容器样式名
    contActive: 'cont-active', 		//tab选中样式对应的容器样式
    cont: 'cont',					//cont容器名，与html中的名称对应上
    items: '__items__'				//cont容器内用来包裹数据的容器样式名，与__loading__并列
}
```

#### `options.render(callback)`

类型：`Function`，渲染函数，页面初始加载、滑到底部、触发load函数都会执行此函数。`callback`为回调函数

#### `options.afterRender(callback)`

类型：`Function`，`render`函数的`callback`执行时触发

#### `options.tabClick($obj)`

类型：`Function`，点击tab时触发，`$obj`为被点击的li元素，为jquery对象

#### `options.scroll(scrollTop)`

类型：`Function`，将`scroll`事件暴露到外面，`scrollTop`为当前滚动值

#### `options.loading`

类型：`Object`，TSL插件中单独使用了loading插件，配置如下：

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
