
	// 百度地图API功能
	map = new BMap.Map("map-container");    // 创建Map实例
	map.centerAndZoom(new BMap.Point(114.3091,30.550172), 11);  // 初始化地图,设置中心点坐标和地图级别
	map.setCurrentCity("武汉");          // 设置地图显示的城市 此项是必须设置的
	map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放

	// 添加定位控件
	geolocationControl = new BMap.GeolocationControl();
	geolocationControl.addEventListener("locationSuccess", function(e){
		// 定位成功事件
		var address = '';
		address += e.addressComponent.province;
		address += e.addressComponent.city;
		address += e.addressComponent.district;
		address += e.addressComponent.street;
		address += e.addressComponent.streetNumber;
	    var mk = new BMap.Marker(e.point);
	    nowLat = e.point.lat;
	    nowLng = e.point.lng;
		map.addOverlay(mk);
		map.panTo(e.point);
	});
	geolocationControl.addEventListener("locationError",function(e){
		// 定位失败事件
	    alert(e.message);
	});
	map.addControl(geolocationControl);
	
	// 创建CityList对象，并放在citylist_container节点内
	var myCl = new BMapLib.CityList({container : "citylist_container", map : map});

	// 给城市点击时，添加相关操作
	myCl.addEventListener("cityclick", function(e) {
		// 修改当前城市显示
		document.getElementById("curCity").innerHTML = e.name;

		// 点击后隐藏城市列表
		document.getElementById("cityList").style.display = "none";
	});
	// 给“更换城市”链接添加点击操作
	document.getElementById("curCityText").onclick = function() {
		var cl = document.getElementById("cityList");
		if (cl.style.display == "none") {
			cl.style.display = "";
		} else {
			cl.style.display = "none";
		}	
	};
	// 给城市列表上的关闭按钮添加点击操作
	document.getElementById("popup_close").onclick = function() {
		var cl = document.getElementById("cityList");
		if (cl.style.display == "none") {
			cl.style.display = "";
		} else {
			cl.style.display = "none";
		}	
	};
	
	// 加载麻点
    customLayer = false;
	function addCustomLayer(keyword) {
		if (customLayer) {
			map.removeTileLayer(customLayer);
		}
		customLayer=new BMap.CustomLayer({
			geotableId: 163864,
			q: '', //检索关键字
			tags: '', //空格分隔的多字符串
			filter: '' //过滤条件,参考http://developer.baidu.com/map/lbs-geosearch.htm#.search.nearby
		});
		map.addTileLayer(customLayer);
		customLayer.addEventListener('hotspotclick',callback);
	}
	function callback(e)//单击热点图层
	{
		
		var customPoi = e.customPoi;//poi的默认字段
		var contentPoi=e.content;//poi的自定义字段
		var isSelected = isInOrderList(contentPoi);

		var content = '<p style="width:280px;margin:0;line-height:20px;">'
		+'店名：'+contentPoi.restName + '<br/>'
		+'配送地址：'+ contentPoi.destAddress +'<br/>价格:'+contentPoi.Pay+'元'+'</p>';

		if(isSelected){
			content += '<button class="mui-btn mui-btn-warning"  onclick=orderUnSelect('+contentPoi.orderID+')>放弃</button>'+'<button onclick=infoWindowClose()>取消</button>';
		}else{
			content +='<button class="mui-btn mui-btn-success" onclick=orderSelect('+contentPoi.orderID+')>选择</button>'+'<button onclick=infoWindowClose()>取消</button>';
		}
		var searchInfoWindow = new BMapLib.SearchInfoWindow(map, content, {
			title: customPoi.title, //标题
			width: 290, //宽度
			height: 100, //高度
			panel : "panel", //检索结果面板
			enableAutoPan : true, //自动平移
			enableSendToPhone: false, //是否显示发送到手机按钮
			searchTypes :[
			]
		});
		var point = new BMap.Point(customPoi.point.lng, customPoi.point.lat);
		searchInfoWindow.open(point);
	}
	var walking = new BMap.WalkingRoute(map, {renderOptions:{map: map, autoViewport: true}});
	
//		addCustomLayer();
function showRoute(start,end){
	walking.clearResults();
	var p1 = new BMap.Point(start[0],start[1]);
	var p2 = new BMap.Point(end[0],end[1]);
	walking.search(p1,p2);
}
nowLng = -1;
nowLat = -1;
function getPosition() {
    geolocationControl.location();
}