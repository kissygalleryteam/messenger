/**
 * @fileoverview 跨域通信 kissy 1.3.0 版本.
 * @author shiran<shiran@taobao.com>
 */
KISSY.add(

	function(S, DOM, Event, UA, JSON, SWF) {


		var	win = window,

			// 该变量在打包时会自动被替换
			VERSION = null,

			// 为了兼容调试和线上
			postMessageSwf = VERSION ? ( 'http://a.tbcdn.cn/s/kissy/gallery/messenger/1.0/flash-post-message.swf' ) :'flash-post-message.swf',

			// url 相关
			search = location.search,

			// 判断是否使用 flash
			useFlash = 'undefined' === typeof postMessage || !win.addEventListener,

			// 判断是否是 iframe
			isIframe = win.top != win,

			// 已注册事件
			attachedEvents = [],

			// swf 相关变量
			swf,
			
			// 当前页面创建的 flash 的name
			flashName = '_MessengerFlash_' + S.now();

		/**
		 * 注册消息事件.
		 * @param { String } type 消息类型.
		 * @param { Function } cb 回调函数.
		 */
		function register(type, cb) {

			attachedEvents.push([type, cb]);

		}

		/**
		 * 发送消息.
		 * @param { String } type 消息类型.
		 * @param { Anything } content 消息内容.
		 * @param { Object | HTMLElement | String } 如果往父窗口发消息, 则为目标窗口对象, 如果往 iframe 发消息, 则为 iframe 节点或者 iframe id.
		 */
		function send(type, content, target) {

			var data = { type: type, content: content },
				iframeEl = target;

			if (S.isString(target)) {
				iframeEl = DOM.get('#' + target);
				target = iframeEl.contentWindow;
			} else if (!useFlash && !isIframe) {

				// contentWindow 获取
				if (target.contentWindow) {
					target = target.contentWindow;
				}

			}

			if (!useFlash) {

				// 高级浏览器
				target.postMessage(JSON.stringify(data), '*');

			} else {

				// 添加延迟, 以免 flash 未初始化完成
				setTimeout(function() {
					if (swf.callSWF) {
						swf.callSWF('send', [data, getTargetFlashName(iframeEl)]);
					} else {
						swf.send(data, getTargetFlashName(iframeEl));
					}
				}, 500);

			}

		}

		/**
		 * 激活事件，仅供内部使用！
		 * @private
		 * @param { String } type 事件类型。
		 * @param { Anything } content 消息主体。
		 */
		function fire(type, content) {

			S.each(attachedEvents, function(ev) {

				if (ev[0] === type) {

					ev[1](content);

				}

			});

		}

		/**
		 * 创建 iframe.
		 * @param { Object | String } attr iframe 节点属性对，如果仅有 src 时可为字符串。
		 * @param { HTMLElement | String } selector 需要放置 iframe 的节点或者节点 selector, 默认为 body。
		 * @return { HTMLElement } iframe 节点。
		 */
		function createIframe(attr, selector) {

			var param = useFlash ? ('parentFlash=' + flashName + '&childFlash=_MessengerChildFlash_' + S.now()) : '',
				src,
				sep;

			if (S.isString(attr)) {
				src = attr;
				attr = {};
			} else {
				src = attr.src;
			}

			attr.src = src + ( src.indexOf('?') > -1 ? '&' : '?' ) + param;

			var iframe = DOM.create('<iframe>', attr);

			iframe.setAttribute('width', 1);
			iframe.setAttribute('height', 1);

			return DOM.get(selector || 'body').appendChild(iframe);

		}

		/**
		 * 获取目标对象的 flashName.
		 * @param { Object } 目标窗口对象.
		 */
		function getTargetFlashName(target) {

			var src = target.src;

			if (src) {

				// 目标为 iframe
				var m = src.match(/childFlash=([^&]+)/);

				if (m && m[1]) {
					// name 必须以 _ 开头
					return m[1];
				} else {
					throw 'iframe has no flashName param';
				}

			} else {

				// 目标为父窗口 ???...
				var topReg = /parentFlash=([^&]+)/,
					m = search.match(topReg);

				if (m && m[1]) {
					return m[1];
				} else {
					throw 'iframe has no topFlashName param';
				}

			}

		}

		if (!useFlash) {

			// 高级浏览器
			win.addEventListener('message', function(ev) {

				var data = ev.data;

				if (data && S.isString(data)) {

					try {

						var ret = JSON.parse(data);

						fire(ret.type, ret.content);

					} catch(e) {};

				}
					
			}, false);	

		} else {

			// flash 函数
			window['_Messenger_Flash_PostMessage'] = function (swfid, msg){

				var type = msg.type,
					data = msg.msg;

				if ('message' == type && data) {
					fire(data.type, data.content);
				}

			};

			// 低级浏览器
			var match = search.match(/childFlash=([^&]+)/);

			if (match && match[1]) {

				// name 必须以 _ 开头
				flashName = match[1];

			}

			// flash 配置
			var flashConfig = {

				src: postMessageSwf,

				attrs: {
					width: 1,
					height: 1,
					style: 'position:absolute;top:0'
				},

				params: {
					flashVars: {
						jsentry: '_Messenger_Flash_PostMessage',
						swfid: 'J_MessengerFlashPostMessage',
						name: flashName
					},
					allowscriptaccess: 'always'
				}

			};

			// flash 对象
			swf = new SWF(flashConfig);

		}

		return {

			register: register,
			send: send,
			createIframe: createIframe,
			flashName: flashName

		};
		
	},

	{
		requires: ['dom', 'event', 'ua', 'json', 'swf']
	}

);

