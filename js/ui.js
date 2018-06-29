(function($,ui){
	ui.scollBounce=function() {
				mui('.mui-scroll-wrapper').scroll({
					scrollY: true, //是否竖向滚动
					scrollX: true, //是否横向滚动
					startX: 0, //初始化时滚动至x
					startY: 0, //初始化时滚动至y
					indicators: true, //是否显示滚动条
					//deceleration: 0.00000001, //阻尼系数,系数越小滑动越灵敏
					bounce: true //是否启用回弹
				});
				var height = plus.display.resolutionHeight;
				document.getElementById("content").setAttribute("style", "min-height:" + (height - 1) + "px;");
				document.getElementById("con-wrap").setAttribute("style", "height:" + (height - 2) + "px;top:45px");
			}
}(mui,window.ui={}));
