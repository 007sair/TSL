/**
 * Polyfill
 */

//bind 函数在 ECMA-262 第五版才被加入
if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5
			// internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function() {},
			fBound = function() {
				return fToBind.apply(this instanceof fNOP ? this : oThis || this,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
}

// Microsoft's JScript 不支持负的 start 索引
if ('ab'.substr(-1) != 'b') {
	/**
	 *  Get the substring of a string
	 *  @param  {integer}  start   where to start the substring
	 *  @param  {integer}  length  how many characters to return
	 *  @return {string}
	 */
	String.prototype.substr = function(substr) {
		return function(start, length) {
			// did we get a negative start, calculate how much it is
			// from the beginning of the string
			if (start < 0) start = this.length + start;

			// call the original function
			return substr.call(this, start, length);
		}
	}(String.prototype.substr);
}

/**
 * Countdown 纯原生倒计时，不依赖任何库
 * @return object
 * @date 2016-07-27 by longchan
 * 调用方法：
		new Countdown(document.getElementById('timer'), {
			time: {
				warm: false, //预热时间
				start: 'July 27, 2016 18:45:20', //活动开始时间
				end: 'July 27, 2016 18:45:30',   //活动结束时间
				back: false, //返场开始时间
				backend: false //返场结束时间
			}
		});
   回调函数(全局) 只在某种状态下调用1次
		onBeforeWarm	当状态为预热前时调用  
		onWarm 			预热开始时调用
		onBeforeStart   活动未开始时调用
		onStart 		活动开始时调用
		onBeforeBack 	返场开始前调用
		onBack 			返场开始时调用
		onEnd 			活动结束时调用

 */
(function() {

	var defaultOptions = {
		date: "June 7, 2087 15:03:25",
		time: {
			now: false,
			warm: false,
			start: false,
			end: false,
			back: false,
			backend: false
		},
		title: ['距预热开始', '距活动开始', '距活动结束', '距返场开始', '距返场结束', '活动已结束'],
		refresh: 1000,
		offset: 0,
		useHour: false,
		onEnd: function() {
			return;
		},
		render: function(date) {
			var html = '';
			if (this.interval) {
				html = '<span class="appw t0">' + date.days + '</span>' + '天' +
					'<span class="appw t1">' + this.leadingZeros(date.hours) + '</span>' + "时" +
					'<span class="appw t2">' + this.leadingZeros(date.min) + '</span>' + "分" +
					'<span class="appw t3">' + this.leadingZeros(date.sec) + '</span>' + "秒" +
					'<span class="appw t4">' + this.leadingZeros(date.millisec) + '</span>' ;
			};
			this.el.innerHTML = this.title + ':' + html;
		}
	};

	/**
	 * Countdown constructor
	 * @param {HTMLElement} el      DOM node of the countdown
	 * @param {Object}      options (optional) Options for the plugin
	 */
	var Countdown = function(el, options) {

		if (!el) return;

		/**
		 * Reference to the DOM element
		 * @type {HTMLElement}
		 */
		this.el = el;

		/**
		 * Options of the countdown plugin
		 * @type {Object}
		 */
		this.options = {};


		/**
		 * Interval reference or false if counter is stopped
		 * @type {Mixed}
		 */
		this.interval = false;

		// callback flag 
		var flag = {};

		// merge default options and options into this.options
		this.mergeOptions = function(options) {
			for (var i in defaultOptions) {
				if (defaultOptions.hasOwnProperty(i)) {
					this.options[i] = typeof options[i] !== 'undefined' ? options[i] : defaultOptions[i];

					// 深拷贝time对象
					if (Object.prototype.toString.call(defaultOptions[i]) === '[object Object]') { //排除其他object类型，如：array
						for(var k in defaultOptions[i]){
							if (defaultOptions[i].hasOwnProperty(k)) {
								this.options[i][k] = typeof options[i][k] !== 'undefined' ? options[i][k] : defaultOptions[i][k];
								if (i === 'time' && typeof this.options[i][k] !== 'object') {
									this.options[i][k] = this.options[i][k] ? new Date(this.options[i][k]) : false;
								};
							};
						}
					};

					// bind context for functions
					if (typeof this.options[i] === 'function') {
						this.options[i] = this.options[i].bind(this);
					}
				}
			}
		}.bind(this);

		this.mergeOptions(options);

		//如果配置里传入了当前时间，则用传入，否则用本地当前时间
		if (this.options.time.now) {
			this.now = +new Date(this.options.time.now);
		};

		var lastDiff = 0, //上一次的剩余秒数
			localDiff = 0,	//本地实时的剩余秒数
			offset = 0; //脚本被禁止时的偏移量


		/**
		 * Get the difference between now and the end date
		 * @return {Object} Object with the diff information (years, days, hours, min, sec, millisec)
		 */
		this.getDiffDate = function() {

			var _now = +new Date(),
				_warm = this.options.time.warm ? this.options.time.warm.getTime() : 0,
				_start = this.options.time.start ? this.options.time.start.getTime() : 0,
				_end = this.options.time.end ? this.options.time.end.getTime() : 0;
				_back = this.options.time.back ? this.options.time.back.getTime() : 0,
				_backend = this.options.time.backend ? this.options.time.backend.getTime() : 0 ;

			lastDiff = localDiff;
			localDiff = Math.floor((_end - _now) / 1000);
			offset = (lastDiff !== 0) ? lastDiff - localDiff : 1;

			var diff;

			if (this.options.time.now) {
				this.now += this.options.refresh * offset;
				_now = this.now;
			};

			if (_now < _start) {
				//活动前 可能有预热
				if (_warm) {
					//有预热
					if (_now < _warm) {
						//预热未开始
						// console.log('预热前')
						this.title = this.options.title[0];
						

						diff = (_warm - _now + this.options.offset) / 1000;
						if (!flag.onBeforeWarm && typeof onBeforeWarm === 'function') {
							onBeforeWarm();
							flag.onBeforeWarm = 1;
						};
					} else {
						//预热已开始
						// console.log('预热中')
						this.title = this.options.title[1];
						diff = (_start - _now + this.options.offset) / 1000;
						if (!flag.onWarm && typeof onWarm === 'function') {
							onWarm();
							flag.onWarm = 1;
						};
					}
				} else {
					//没预热 活动未开始
					// console.log('活动未开始')
					this.title = this.options.title[1];
					diff = (_start - _now + this.options.offset) / 1000;
					if (!flag.onBeforeStart && typeof onBeforeStart === 'function') {
						onBeforeStart();
						flag.onBeforeStart = 1;
					};
				}
			} else if (_now >= _start && _now < _end) {
				//活动中
				// console.log('活动中')
				this.title = this.options.title[2];
				diff = (_end - _now + this.options.offset) / 1000;
				if (!flag.onStart && typeof onStart === 'function') {
					onStart();
					flag.onStart = 1;
				};
			} else {
				//活动后 可能有返场
				if (_back && _backend && _back >= _end) {
					//有返场
					if (_now < _back) {
						//返场前
						// console.log('返场前')
						this.title = this.options.title[3];
						diff = (_back - _now + this.options.offset) / 1000;
						if (!flag.onBeforeBack && typeof onBeforeBack === 'function') {
							onBeforeBack();
							flag.onBeforeBack = 1;
						};
					} else if (_now >= _back && _now < _backend) {
						//返场中
						// console.log('返场中')
						this.title = this.options.title[4];
						diff = (_backend - _now + this.options.offset) / 1000;
						if (!flag.onBack && typeof onBack === 'function') {
							onBack();
							flag.onBack = 1;
						};
					} else {
						//返场活动结束
						// console.log('返场活动结束')
						this.title = this.options.title[5];
						diff = 0;
						if (!flag.onEnd && typeof onEnd === 'function') {
							onEnd();
							flag.onEnd = 1;
						};
					}
				} else {
					//活动结束
					// console.log('活动结束')
					this.title = this.options.title[5];
					diff = 0;
					if (!flag.onEnd && typeof onEnd === 'function') {
						onEnd();
						flag.onEnd = 1;
					};
				}
			}

			var dateData = {
				years: 0,
				days: 0,
				hours: 0,
				min: 0,
				sec: 0,
				millisec: 0
			};

			if (diff <= 0) {
				if (this.interval) {
					this.stop();
					this.options.onEnd();
				}
				return dateData;
			}

			if (!this.options.useHour) {
				if (diff >= (365.25 * 86400)) {
					dateData.years = Math.floor(diff / (365.25 * 86400));
					diff -= dateData.years * 365.25 * 86400;
				}
				if (diff >= 86400) {
					dateData.days = Math.floor(diff / 86400);
					diff -= dateData.days * 86400;
				}
			};

			if (diff >= 3600) {
				dateData.hours = Math.floor(diff / 3600);
				diff -= dateData.hours * 3600;
			}

			if (diff >= 60) {
				dateData.min = Math.floor(diff / 60);
				diff -= dateData.min * 60;
			}

			dateData.sec = Math.round(diff);

			dateData.millisec = diff % 1 * 1000;

			return dateData;
		}.bind(this);

		/**
		 * Add leading zeros to a number
		 * @param  {Number} num    Input number
		 * @param  {Number} length Length of the desired output
		 * @return {String}        String of the desired length with leading zeros
		 */
		this.leadingZeros = function(num, length) {
			length = length || 2;
			num = String(num);
			if (num.length > length) {
				return num;
			}
			return (Array(length + 1).join('0') + num).substr(-length);
		};

		/**
		 * Update the end date of the countdown
		 * @param  {Mixed}     newDate Date object or a String/Number that can be passed to the Date constructor
		 * @return {Countdown}         Countdown instance
		 */
		this.update = function(newDate) {
			if (typeof newDate !== 'object') {
				newDate = new Date(newDate);
			}
			this.options.date = newDate;
			this.render();
			return this;
		}.bind(this);

		/**
		 * Stop the countdown refresh / rerender
		 * @return {Countdown} Countdown instance
		 */
		this.stop = function() {
			if (this.interval) {
				clearInterval(this.interval);
				this.interval = false;
			}
			return this;
		}.bind(this);

		/**
		 * Render the countdown
		 * @return {Countdown} Countdown instance
		 */
		this.render = function() {
			this.options.render(this.getDiffDate());
			return this;
		}.bind(this);

		/**
		 * Start the countdown
		 * @return {Countdown} Countdown instance
		 */
		this.start = function() {
			// don't start if the countdown is already started
			if (this.interval) {
				return;
			}

			this.render();

			if (this.options.refresh) {
				this.interval = setInterval(this.render, this.options.refresh);
			}

			return this;
		}.bind(this);

		/**
		 * Update the offset
		 * @param  {Number}    offset New offset in ms
		 * @return {Countdown}        Countdown instance
		 */
		this.updateOffset = function(offset) {
			this.options.offset = offset;
			return this;
		}.bind(this);


		/**
		 * Restart the countdown and update options
		 */
		this.restart = function(options) {
			this.mergeOptions(options);
			this.interval = false;
			this.start();
			return this;
		}.bind(this);


		// initial start of the countdown or initial render
		this.start();
	};

	window.Countdown = Countdown;

	if (typeof module != 'undefined' && module.exports) {
		module.exports = Countdown;
	}


})();
	
