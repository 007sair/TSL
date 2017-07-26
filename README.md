# TSL

`T`(tab)`S`(scroll)`L`(load)插件

## 功能

- tab切换
- tab左右滑动
- tab悬浮
- 上滑翻页加载

## Usage

### `HTML:`

```
<div class="J_tab">
    <div class="tsl-tab">
        <div class="J_iscroll">
            <ul>
                <li _id="1" class="active">tab1</li>
                <li _id="2">tab2</li>
                ...
            </ul>
        </div>
    </div>
</div>

<div class="tsl-cont J_cont">
    <!-- js会将数据渲染到这里 -->
</div>
```

注意：凡是涉及到`J_`开头的`class`，都会在插件内被使用到，如有冲突，请自行修改。其他`class`可随意修改为自己的样式名。


### `JS:`

```
new TSL({
    className: {
        //如果class有冲突，可以在这里重新定义
    },
    render: function(cb) {
        var me = this;
        var curTab = me.tabs[me.curTabIndex];

        if (curTab.isEnd) { //判断当前页面是否全部加载完毕
            me.loader.inform('- 到底啦 -');
            return false;
        }

        if (this.xhr) { //挂起重复ajax
            this.xhr.abort()
        }

        //ajax请求
        this.xhr = $.ajax({
            url: 'images/data/common_list.json',
            type: 'get',
            data: {
                page: curTab.page,
                tab: me.curTabIndex,
                id: me.$tab.find('li').eq(me.curTabIndex).attr('_id')
            },
            dataType: 'json',
            success: function (data) {
                if (data.flag == 1) {
                    //渲染数据
                    //call：修改this指向
                    renderList.call(me, data.data_list);

                    curTab.page++;
                    me.loader.inform('- 上滑继续加载 -');
                } else {
                    if (data.flag == 0 || !data.data_list.length) {
                        curTab.isEnd = true;
                        me.loader.inform('- 到底啦 -');
                    }
                }

                //必须得有
                curTab.isRender = true;
                cb && cb();
            },
            error: function () {
                console.log('ajax error');
                me.reload();
            }
        });
    }
});

function renderList(arr) { //ajax请求到的数据，一般为数组类型
    // 注意：此函数的this指向在调用时被call修改过，所以指向TSL实例
    // 举个栗子：
    // this.$conts 等于 $('.J_cont');
    // this.curTabIndex 等于 当前tab的索引值
    // this.opts.className.items 等于 '__items__';
    // this.$cont.eq(this.curTabIndex).find('.' + this.opts.className.items);
    // 等于
    // $('.J_cont').eq(index).find('.__items__')

    //this的属性方法，请参考下方API，自行console
}
```

## API

### new TSL(options);

options为传入的对象，对象属性与方法如下：

`**options.startPage**`

> 类型：`Number`，默认值：1

页面起始页数

`**options.iScroll**`

> 类型：`String`，默认值：'.J_iscroll'

iscroll插件引用的className，注意有个`.`

`**options.className**`

> 类型：`Object`

各种需要用到的className

```
{
    tab: 'J_tab',			//(type:String) tab区class
    conts: 'J_cont',		//(type:String) tab cont区父class
    cont: 'cont',			//(type:String) tab cont区每个容器class
    items: '__items__'		//(type:String) 商品列表外层总的容器class，与loading的div同级
}
```

`**options.render(callback)**`

> 类型：`Function`

渲染函数，在页面滚动到底部及切换tab时触发。`callback`为回调函数

`**options.afterRender(callback)**`

> 类型：`Function`

`render`函数的`callback`函数执行时会调用`afterRender`

`**options.click($curTab)**`

> 类型：`Function`

点击tab时触发，`$curTab`为被点击的li元素，为jquery对象

`**options.scroll(scrollTop)**`

> 类型：`Function`

将`scroll`事件暴露到外面，`scrollTop`为当前滚动值

`**options.loading**`

> 类型：`Object`

TSL插件中单独使用了loading插件，配置如下：

```
{
    styleID: '__loading_style__',   //(type:String) style标签的id属性
    className: '__loading__',      //(type:String) loading元素的className
    icon: 'xxx.png',   //(type:String) loading菊花图标
    size: 20,          //(type:Number) loading大小，影响图标与字体大小
    multi: 2.5,        //(type:Number) loading大小系数，影响图标的高度
    html: '<i></i><span>加载中, 请稍后...</span>' //(type:String)  loading文本内容
}
```
