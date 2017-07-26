/**
 * 向上滚动效果
 * ----------
 * 【业务逻辑】：
	在ajax的success函数中调用init(arr)方法，arr为ajax获取到的全部数据；
	然后将全部数据存入临时数组中，初次加载从临时数组中取出3条数组渲染到dom中；
	每向上滚动一次，从临时数组中取出数据渲染到dom，当临时数组为空后循环滚动现有所有数据。
 * 【逻辑目的】：优化一次加载过多数据到dom会增加请求、影响页面性能
 * 【使用方法】：
 	HTML:
	    <div class="noticebox">
			<ul class="J_scrollUp"></ul>
		</div>
	JavaScript:
		var scrollnotice = new ScrollNotice($('.J_scrollUp'), {
			isFix: false,
			speed: 2000
		});
		scrollnotice.init(arr); //arr为ajax得到的数据，类型为数组
 */

function ScrollNotice(elem, options) {
	this.$elem = elem; //ul元素
	this.defaults = {
		marginbotton: 50,
		isFix: true, //滚动时是否需要定住 默认滚动时需要
		firstCount: 3, //第一次取3个
		count: 1, //以后每滚动一次，取1个
		speed: 3000, //滚动速度
		top: 300, //初始位置  默认距顶部150px 
		distance: 60 //当滑动了60px后定住
	};
	this.opts = $.extend({}, this.defaults, options);
	this.isEnd = false;
	this.count = 0; //每滚动一次，count加1
	this.data = []; //外部传入的数组数据
}

ScrollNotice.prototype = {
	constructor: ScrollNotice,
	/**
	 * 初始化效果，data为获取到的全部数据，数组类型
	 */
	init: function(data) {
		//如果数据为空 or 元素不存在，则终止程序
		if (!data.length || !this.$elem.length) return false;

		//将传入的数据复制一份给this.data
		this.data = data.slice(0);
		this.opts.isFix && this.fix();
		this.add(this.opts.firstCount); //初始化时加入3条数据
		this.move(); //调用滚动效果
	},
	/**
	 * 向dom中渲染指定个数的li
	 * @param num  {number}   指定的个数
	 */
	add: function(num) {
		var me = this;
		if (me.data.length == 0) { //数据全部加载完
			me.end();
			return false;
		};
		this.render(me.data.splice(0, num));
	},
	render: function(arr) {
		var html = '';
		for (var i = 0, len = arr.length; i < len; i++) {
			html += '<li style="margin-bottom:'+ this.opts.marginbotton +'px;" _id="'+ arr[i].id +'"><a href="javascript:;"><img src="' + this.replaceSrc(arr[i].icon) + '" alt="">' + arr[i].title + this.count + '</a></li>';
		}
		this.$elem.append(html);
	},
	end: function() { //数据全部加载完毕后循环加载已有数据
		this.$elem.append(this.$elem.find('li').first().clone());
		this.isEnd = true;
	},
	move: function() { //滚动效果
		var me = this;
		var $li = this.$elem.find('li'),
			iheight = $li.height(),
			len = $li.length;

		setInterval(function() {
			me.count++;
			me.$elem.animate({
				translate3d: '0,' + -(iheight + me.opts.marginbotton) * me.count + 'px,0'
			}, 500, 'ease-out', function() {
				len = me.$elem.find('li').length;
				if (me.count >= len - 1 && me.isEnd) {
					me.count = 0;
					$(this).animate({translate3d: '0,0,0'}, 0);
				};
				if (!me.isEnd) {
					me.add(me.opts.count);
				}
			});
		}, me.opts.speed);

	},
	fix: function() {
		var me = this;
		var $notice = this.$elem.parent();
		$notice.css('top', me.opts.top);
		var _top = $notice.offset().top;
		window.addEventListener('scroll', function() {
			var st = $(window).scrollTop();
			if (st > me.opts.distance) {
				$notice.css({
					'position': 'fixed',
					'top': _top - me.opts.distance
				});
			} else {
				$notice.css({
					'position': 'absolute',
					'top': me.opts.top
				});
			}
		});
	},
	replaceSrc: function(src) {
		var reg = /img0[1-4]/;
		if (reg.test(src)) {
			src = src.replace(reg, (Math.random() > 0.5) ? 'img05' : 'img06');
			if (/img05|img06/.test(src) && src.indexOf('@base') < 0) { //@base@tag=imgScale&w=447&q=100
				src += '@base@tag=imgScale&w=50&q=90'
			}
		}
		return src;
	}
};


$.fn.scrollNotice = function(opts) {
	var scrollnotice = new ScrollNotice(this, opts);
	return scrollnotice.init();
};

module.exports = ScrollNotice;
