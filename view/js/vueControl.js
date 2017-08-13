var vmBartitle = new Vue({
	el:"#barTitle",
	data:{
		barTitle:"欢迎你~"
	}
});

//var vmMap = new Vue({
//	el:"#map-container",
//	methods:{
//		click:function(){
//			
//		}
//	}
//})

var vmMapCitys = new Vue({
	el:"#map-top-control",
	data:{
		currentCity:"武汉市",
		locating:"定位中...",
		userCondition:"空闲"
	}
});

setInterval(function() {
    vmMapCitys.locating = "定位中...";
    getPosition();
    vmMapCitys.locating = "已定位";
},15000);

defaultBottom = {
	btnStart:"接单",
	btnOK:"确定",
	bottomStatus:"已选择--单",
	selected:0,
	
	eventOrders: 0,
	showBtnStart:true,
	showStatus:false,
	showBtnOK:false,
	
	btnStartClass:"map-bottom-icons-0",
	btnOKClass:"map-bottom-icons-0"
};

vmMapBottom = new Vue({
	el:"#map-bottom-control",
	data:defaultBottom,
	methods:{
		clickBtnStart:function(){
			if(this.eventOrders == 0){
				this.btnStart="自动接单";
				this.btnOK="手动接单";
				this.bottomStatus="<---请选择接单方式--->";
				this.btnStartClass="map-bottom-icons-1";
				this.btnOKClass="map-bottom-icons-1";
				this.showBtnStart=true;
				this.showStatus=true;
				this.showBtnOK=true;
				this.eventOrders = 1;
			}else if(this.eventOrders == 1){
				// 触发 “自动接单” 确认框
				addCustomLayer();
				mui('#middlePopover').popover('toggle');
			}else if(this.eventOrders == 2){
				// 触发“手动选单”的取消
				this.eventOrders = 0;
				this.clickBtnStart();
				if (customLayer) {
					map.removeTileLayer(customLayer);
				}
			}
		},
		clickBtnOK:function(){
			if(this.eventOrders == 1){
				// 触发“手动选单”模式
				addCustomLayer();
				this.btnStartClass="map-bottom-icons-0";
				this.btnOKClass="map-bottom-icons-2";
				this.btnStart="取消";
				this.btnOK="确定";
				this.bottomStatus="已选择"+this.selected.toString()+"单";
				this.eventOrders =2;
			}else if(this.eventOrders == 2){
				// 触发“手动选单”提交确认
				if(this.selected > 10){
					mui.alert("超过接单上限","温馨提示");
					return;
				}else if(this.selected < 1){
					mui.alert("请至少选择一单","温馨提示");
					return;
				}
//				mui.confirm("你一共选择了"+this.selected.toString()+"单，确定吗？","选单确认")
				mui("#bottomPopover").popover("show");
			}
		},
		clickStatus:function(){
			if(this.eventOrders == 2){
				if(this.selected > 10){
					mui.alert("超过接单上限","温馨提示");
					return;
				}else if(this.selected < 1){
					mui.alert("请至少选择一单","温馨提示");
					return;
				}
				mui("#bottomPopover").popover("toggle");
			}
		},
		
		flushNum:function(){
            this.selected=bottomPopover.orders.length;
            this.bottomStatus="已选择"+this.selected.toString()+"单";
		},
		
		closeBottom:function(){
			if (customLayer) {
				map.removeTileLayer(customLayer);
			}
			this.showBtnStart=false;
			this.showStatus=false;
			this.showBtnOK=false;
			this.eventOrders = 0;
			this.selected = 0;
		}
	}
});

var vmautoPopover = new Vue({
	el:"#middlePopover",
	data:{
		range:4,
		maxNumOfOrders:6
	},
	methods:{
		close:function (e){
			mui('#middlePopover').popover('toggle');
		},
		submit:function(e){
			mui(e.target).button('loading');
			// 提交自动选单请求，收到信息后，关闭此窗口，弹出确认订单窗口
            if(nowLat < 0 || nowLng < 0){
                mui.alert("无法确定你的位置,请使用手动接单");
                mui(e.target).button('reset');
                return 0;
            }
			$.ajax({
				url:"http://map.oattao.cn/autoOrders",
				type:"get",
				dataType:"json",
				data:{longitude:nowLng,latitude:nowLat,range:this.range,maxOrder:this.maxNumOfOrders},
				success:function (data) {
                    mui(e.target).button('reset');
                    bottomPopover.orders = data;
                    vmMapBottom.flushNum();
                    mui('#bottomPopover').popover('toggle');
                }
			});
		}
	}
});

var bottomPopover = new Vue({
	el:"#bottomPopover",
	data:{
		orders:[]
	},
	methods:{
		closeConfirm:function (e){
			mui('#bottomPopover').popover('toggle');
		},
		confirm:function(e){
			mui("#bottomPopover").popover("toggle");
			mui.confirm("你一共选择了"+vmMapBottom.selected.toString()+"单，确定吗？","选单确认",function (e){
				if(e.index == 1){
					// 向服务器提交最终订单信息
                    var datas = {"ordersID":[],"longitude":nowLng,"latitude":nowLat};
                    bottomPopover.orders.forEach(function (e) {
						datas.ordersID.push(e.orderID.toString());
                    });

					$.ajax({
						url:"http://map.oattao.cn/postOrders",
						type:"POST",
						dataType:"json",
						data:JSON.stringify(datas),
                        contentType: "application/json; charset=utf-8",
						beforeSend:function () {
                        },
						success:function (data) {
                            routeGuiding.steps = data.routes;
                            mui.alert("路线生成成功,可以开始按步骤配送了");
                            vmMapCitys.userCondition = "配送中";
                            vmMapBottom.closeBottom();
                            routeGuiding.show = true;
                            nextRoute(routeGuiding.steps[0]);
                        }
					});
				}else{
					mui("#bottomPopover").popover("toggle");
				}
			});
			
		}
		
	}
});

var routeGuiding = new Vue({
	el:"#map-bottom-guide",
	data:{
		show:false,
		steps:[],
		currentNum:0
	},
	methods:{
		leftArrowClick:function(){
			if(this.currentNum >0){
				this.currentNum -= 1;
				nextRoute(this.steps[this.currentNum]);
			}
		},
		detailClick:function(){
			$("#guide-detail").toggle(100);
		},
		nextClick:function(){
			if(this.currentNum < this.steps.length-1){
				this.currentNum += 1;
				nextRoute(this.steps[this.currentNum]);
			}else{
				mui.confirm("您是否完成了所有订单的配送?","完成确认",function (e) {
					if(e.index == 1){
                        mui.alert("恭喜，您已完成所有订单~");
                        vmMapCitys.userCondition = "空闲";
					}
                })
			}
			
		}
	}
});

// 选中的订单ID
var orderList = [];

// 被点击过的订单
var allSelectedList = [];

function isInOrderList(contentPoi){
	if($.inArray(contentPoi.orderID.toString(), orderList) < 0){
		allSelectedList.push(contentPoi);
		return false;
	}
	return true;
}
function orderSelect(orderID){
	
	if($.inArray(orderID.toString(), orderList) < 0){
		// vmMapBottom.selected += 1;

		
		orderList.push(orderID.toString());
		// 在已点击过的订单中查找，放入bottomPopover.orders中，准备发送给服务器
		bottomPopover.orders.push(itemOfContent(allSelectedList, orderID));
        vmMapBottom.flushNum();
		infoWindowClose();
		mui.toast("操作成功");
	}else{
		mui.toast("你已经选中该订单");
	}
}
function orderUnSelect(orderID){
	// vmMapBottom.selected -= 1;

	orderList.splice($.inArray(orderID.toString(), orderList), 1);
	bottomPopover.orders.splice($.inArray(itemOfContent(allSelectedList, orderID), bottomPopover.orders),1);
    vmMapBottom.flushNum();
	infoWindowClose();
	mui.toast("操作成功");
}

function infoWindowClose(){
	$(".BMapLib_bubble_close").click();
}

function itemOfContent(list,orderID){
	for(var i=0; i<list.length; i++){
		if(list[i].orderID.toString() == orderID.toString()){
			return list[i];
		}
	}
	console.log("on");
	return -1;
}

function nextRoute(step){
	try{
		showRoute(step.startP,step.endP);
	}catch(e){
		mui.alert("服务器错误，请稍后再试");
	}
	return 0;
}