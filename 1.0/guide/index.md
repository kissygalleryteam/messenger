跨域消息通信
=================================

该组件提供跨域的父页面与子页面通信(仅适用于动态创建的子 iframe)。

* 版本：1.0
* demo：[http://gallery.kissyui.com/messenger/1.0/demo/index.html](http://gallery.kissyui.com/messenger/1.0/demo/index.html)

API 接口：
-------------------------------

	* register: 注册消息
		- type: 消息类型；
		- cb: 回调函数;

	* send: 发送消息
		- type: 消息类型；
		- content: 消息内容；
		- target: 消息发送的对象；

	* createIframe: 创建 iframe （ 该方法用于动态创建需与之通信的 iframe ）
		- attr: iframe attribute 属性对；
		- selector：需要将 iframe 插入的节点；

调用方式：
------------------------------------

父页面：

	KISSY.use('gallery/messenger/1.0/', function(S, M) {

		var iframe = M.createIframe(/* ... */);		

		M.register('child', function(data) { alert(data); });

		// 最后一个参数为 iframe 节点或者 id 名
		M.send('parent', 'haha', iframe);

	});


子页面：

	KISSY.use('gallery/messenger/1.0', function(S, M) {

				
		M.register('parent', function(data) { alert(data); });

		// 最后一个参数为父窗口对象
		M.send('child', 'hehe', window.parent);

	});

