(function($,w){

	//判断是否为空对象
	function isEmptyObject(e) {  
    for (var k in e)  
        return !1;  
    return !0  
	}
	
	var FilterBox = function(el, options){
		this.options = options;
	    this.$el = $(el);
	    this._groupName = [];
	    this.init();
	};

	FilterBox.DEFAULTS = {
		url : undefined,
		title: [{
			field: undefined, // 提取对应data里的属性
			title: undefined, // 筛选类别标题
			type: undefined, // 生成筛选类型 cheack,search,time,choose
			label: undefined, // 生成复选框与下拉选择框所对应的属性名
			attributes: null, // 自定义属性 {}
			splitArray: null, // 生成复选框数据时分组参数 []，仅当type为cheack时生效
			groupName: 'group', // 下拉类型选择分组组名
			value: undefined, // 筛选框value值
			unlimitedName: '不限',
			searchBoxUrl: undefined, // 查询及时生成下拉框选择
			searchBoxName: undefined, // 参数的key值
			queryParams: function(params){ // 自定义查询参数
				return params;
			}
		}],
		data:null, // 数据 {}
		clearBtn: true,
		change: function(checkes){
			return false;
		},
		clearBack: function(){
			return false;
		}
	};
	
	// 初始化
	FilterBox.prototype.init = function(){

		this.initOpts();
		this.initContainer();
		this.initFilterBoxRouter();
		this.unlimited();
		
		$(document).on('click',function(e){
			$('.btn-group').removeClass('open');
		});
		
		
	};



	// 合并数据
	FilterBox.prototype.initOpts = function(){
		var that = this;
		if(this.options.title && this.options.title.length != 0){
			var arr = this.options.title;
			var _arr = [];
			for(var i=0; i<arr.length; i++){
				for(var k in FilterBox.DEFAULTS.title[0]){
					if(!arr[i][k]){
						arr[i][k] = FilterBox.DEFAULTS.title[0][k];
					}
				}
			}
		}
		
		if(this.options.url){
			try{
				$.ajax({
					url: this.options.url,
					type: 'get',
					async: false,
					success: function(msg){
						if(msg.status == 200){
							that.options.data = msg.result;
						}
					}
				});
			}catch(err){
				console.log(err);
			}
		}
	}
	
	// 中心结构
	FilterBox.prototype.initContainer = function(){
		
		this.$container = $([
	        '<div class="filter filter-box">',
        	'<div class="fixed-filter-checked">',
          '</div><div class="fixed-filter-search clearfix"></div></div>'
	     ].join(''));

		this.$el.html(this.$container);
		this.$check = this.$el.find('.fixed-filter-checked');
		this.$search = this.$el.find('.fixed-filter-search');
	};

	// 判断生成筛选框类型
	FilterBox.prototype.initFilterBoxRouter = function(){
		var titles = this.options.title;
		var that = this;
		for(var i=0; i<titles.length; i++){
			var title = titles[i];
			var type = title.type.toLowerCase();
			switch (title.type){
				case 'cheack': 
					initCheack(that,title);
					break;
				case 'search':
					initSelect(that,title);
					break;
				case 'choose':
					initSelect(that,title);
					break;
				case 'time':
					initSelect(that,title);
					break;
				default:
					console.log('未填写数据类型，类型可为cheack,search,choose,time');
					break;
			}
		};
		
		
		if(that.options.clearBtn){
			var $clearBtn = $(['<div class="columns-right filter_btn-group pull-left filter_box-clear">',
						'<div class="btn-group">',
							'<button type="button" class="btn btn-primary"><i class="fa fa-eraser"></i> 清除筛选</button>',
						'</div>',
					'</div>'].join(''))
			that.$search.append($clearBtn);
			
			$clearBtn.on('click',function(){
				that.options.clearBack();
				that.clear();
			})
		}
	}

	// 初始化复选框
	function initCheack(that,title){
		//try{
			var datas = that.options.data[title.field]; // 找到当前数据
			var slip = title.splitArray;
			var name = title.label;

			if(slip != undefined && slip.length != 0){
				for(var i=0; i<slip.length; i++){
	
					if(slip[i] < datas.length){
						datas.splice(slip[i],0,'-');
					}else{
						throw new Error('splitArray参数必须小于数据总数');
						break;
					}
				}
			}
			
			
			//  增加不限复选框
			datas.unshift('-');
			var _obj = {};
			_obj[title.label] = title.unlimitedName;
			_obj._class = 'other';
			datas.unshift(_obj);
			
			var $group = $([
						'<div class="filter_checked-line clearfix" data-filter-id="'+title.field+'">',
						'<span>'+title.title+'</span>',
						'<div class="filter_checked-group"></div>',
						'</div>'
				].join(''));
	    
		    that.$check.append($group);
		    var $checkGroup = $group.find('.filter_checked-group');
		
		    for(var i=0; i<datas.length; i++){
		    	var data = datas[i];
		    	if(data === '-'){
		    		var $split = $('<div class="filter_split">|</div>');
		    		$checkGroup.append($split);
		    		continue;
		    	}
		    	var _id = title.field +'_'+ +new Date() + i;
		    	var $checkbox = $('<div class="filter_checkbox"><label for="'+_id+'"><input type="checkbox" id="'+_id+'">'+data[title.label]+'</label></div>');
		
		    	if(!isEmptyObject(title.attributes)){
		
		    		for(var k in title.attributes){
		    			$checkbox.attr(k,data[title.attributes[k]]);
		    		}
		    	}
		
		    	if(data._class){
						$checkbox.addClass(data._class).find('input').prop('checked',true).attr('disabled',true);
		    	}
		
		    	if(title.value){
		    		$checkbox.find('input').attr('data-val',data[title.value]);
		    	}
		
		    	$checkGroup.append($checkbox);
		    }
		/*}catch(err){
			console.log(err.message);
			return false;
		}*/
	}

	// 初始化下拉框
	function initSelect(that,title){
		var $group = null,$html,datas;
		var groupName = title.groupName;
		var searchTimeOut = null, searchTime = 100;
		var keyupTimeOut = null, keyupTime = 500;
		var oldText = '';
		//判断该组是否已经存在
		if(that._groupName.indexOf(groupName) < 0){

			that._groupName.push(groupName);

			$group = $('<div class="columns-right filter_btn-group pull-left '+ groupName +'"></div>');

			that.$search.append($group);
		}
		
		

		// 生成搜索框
		if(title.type === 'search'){
			$html = $(['<div class="btn-group" data-filter-id="'+title.field+'">',
              '<button type="button" class="btn btn-primary dropdown-toggle" aria-haspopup="true" aria-expanded="false">'+ title.title +' <span class="caret"></span><p class="select-value"></p></button>',
              '<ul class="dropdown-menu search">',
                '<li><input type="text"><i class="fa fa-search"></i></li>',
                '<li class="filter_box-searchbox" style="display: none;"><ul></ul></li>',
              '</ul>',
            '</div>'].join(''));
			
			that.$search.find('.' + groupName).append($html);
			
			//键盘搜索事件
			$html.on('keyup',function(event){
				//回车
				if(event.keyCode == 13){
					showSearchData();
				}
			});
			
			$html.find('input').siblings('i').on('click',function(){
				showSearchData();
			});
			
			$html.find('.dropdown-toggle').on('click',function(event){
				event.stopPropagation();
				$('.btn-group').removeClass('open');
				$(this).parent().addClass('open');
			});
			
			$html.on('click',function(event){
				event.stopPropagation();
			});
			
			// 判断是否存在及时查询搜索框
			if(title.searchBoxUrl){
				var $selectBox = $html.find('.filter_box-searchbox');
				var currentItem = -1;
				var oldItem = -1;
				
				$html.find('input').on('keyup',function(event){
					event.preventDefault();
					if(event.keyCode == 37 || event.keyCode == 38 || event.keyCode == 39 || event.keyCode == 40) return;
					clearTimeout(keyupTimeOut);
					keyupTimeOut = null;
					var $this = $(this);
					
					keyupTimeOut = setTimeout(function(){
						var queryParams = title.queryParams({
							value: $this.val()
						});
						
						try{
							$.ajax({
								url: cxt + title.searchBoxUrl,
								type: 'post',
								data: queryParams,
								success:function(data){
									if(data.status == 200){
										if(data.result.length != 0){
											
											var str = '';
											for(var i=0; i< data.result.length; i++){
												var _name = data.result[i][title.searchBoxName] || data.result[i].name;
												str += '<li title="'+_name+'">'+_name+'</li>';
											}
											$selectBox.children('ul').html(str);
											
										}else{
											
											$selectBox.children('ul').html('<li title="无符合条件记录，请尝试输入完整毕业院校。">无符合条件记录，请尝试输入完整毕业院校。</li>');
										
										}
										$selectBox.show();
										currentItem = -1;
										oldItem = -1;
									}
								}
							});
						}catch(err){
							console.log(err);
						}
					},keyupTime);
				});
				
				// 绑定键盘事件
				$html.on('keyup',function(){
					var $searchShowBox = $html.find('.filter_box-searchbox').children('ul');
					var searchShowBoxHeight = $html.find('.filter_box-searchbox').outerHeight();
					var lisLength = $html.find('.filter_box-searchbox li').length;
					var pHeight = $html.find('.filter_box-searchbox li').outerHeight() * lisLength;
					var scrollBar = searchShowBoxHeight / pHeight * (searchShowBoxHeight - 36);
					
					if((event.keyCode == 38 || event.keyCode == 40 || event.keyCode == 13)){
						//向上
						if(event.keyCode == 38){
							if(currentItem == -1 || currentItem == 0){
								currentItem = lisLength - 1;
								
								$searchShowBox.scrollTop(pHeight - scrollBar) ;
							}else{
								currentItem = currentItem -1;
								
								$searchShowBox.scrollTop(currentItem * ((pHeight - scrollBar) / lisLength)) ;
							}

							$searchShowBox.find('li').removeClass('choose-color');
						
							$searchShowBox.find('li').eq(currentItem).addClass('choose-color');	
						};
						
						// 向下
						if(event.keyCode == 40){
							if(currentItem == lisLength-1){
								currentItem = 0;
								$searchShowBox.scrollTop(0) ;
							}else{
								
								currentItem = currentItem + 1;
								$searchShowBox.scrollTop(currentItem * ((pHeight - scrollBar) / lisLength)) ;
							}
							
							$searchShowBox.find('li').removeClass('choose-color');
							
							$searchShowBox.find('li').eq(currentItem).addClass('choose-color');	
						};
						
						//回车
						if(event.keyCode == 13){
							if($('.choose-color').text()){
								$searchShowBox.parent().siblings().children('input').val($('.choose-color').text());
							}
							
							clearTimeout(keyupTimeOut);
							keyupTimeOut = null;
							showSearchData();
						}
					}
				});
				
				$html.find('.filter_box-searchbox').children('ul').on('click','li',function(event){
					//event.stopPropagation();
					$(this).parents('.filter_box-searchbox').siblings().children('input').val($(this).text());
					showSearchData();
				});
				
			}

			if(!isEmptyObject(title.attributes)){
				for(var k in title.attributes){
					$html.find('input').attr(k,title.attributes[k]);
				}
			}

			function showSearchData(){
				$html.removeClass('open');
				if($html.find('input').val().trim() !== ''){
					$html.find('button').addClass('on');

					$html.find('.select-value').html($html.find('input').val().trim());
					//$html.find('input').val('');
				}else{
					$html.find('button').removeClass('on');
					$html.find('.select-value').html('');
				}
				
				if($html.find('.select-value').html() != oldText){
					oldText = $html.find('.select-value').html();
					that.options.change(that.getAll());
				}
			}
			
		}

		// 生成下拉选择框
		if(title.type ===  'choose'){
			
			var datas = that.options.data[title.field]; // 找到当前数据

			$html = $(['<div class="btn-group" data-filter-id="'+title.field+'">',
              '<button type="button" class="btn btn-primary dropdown-toggle" aria-haspopup="true" aria-expanded="false">'+ title.title +' <span class="caret"></span><p class="select-value"></p></button>',
              '<ul class="filter_dropdown-menu choose">',
              '</ul>',
            '</div>'].join(''));
			
			that.$search.find('.' + groupName).append($html);

			if(title.label != undefined && datas.length != 0){
				var body = '';

				for(var i=0; i<datas.length; i++){
					var $body = $('<li><input type="checkbox"><span>'+datas[i][title.label]+'</span></li>');

					$html.find('.choose').append($body);

					if(title.attributes != undefined){
						for(var k in title.attributes){
							$body.attr(k, datas[i][title.attributes[k]]);
						}
					}
					
					if(title.value){
						$body.find('input').attr('data-val', datas[i][title.value]);
			    	}
				}
			}
			
			
			
			$html.find('input').on('click',function(){
				showChooseData();
			});
			
			$html.find('.dropdown-toggle').on('click',function(event){
				event.stopPropagation();
				$('.btn-group').removeClass('open');
				$(this).parent().addClass('open');
			});
			
			$html.on('click',function(event){
				event.stopPropagation();
			});
			
			function showChooseData(){
				var cheacked = $html.find('input:checked');
				
				if(cheacked.length !== 0){
					$html.find('button').addClass('on');
					var arr = [];
					cheacked.map(function(){
						return arr.push($(this).siblings().text());
					});
					$html.find('.select-value').html(arr.join('，'));
				}else{
					$html.find('button').removeClass('on');
					$html.find('.select-value').html('');
				}
				
				if($html.find('.select-value').html() != oldText){
					oldText = $html.find('.select-value').html();
					that.options.change(that.getAll());
				}
			}
			
			

		}

		// 生成下拉时间选择框
		if(title.type === 'time'){
			$html = $(['<div class="btn-group" data-filter-id="'+title.field+'">',
			              '<button type="button" class="btn btn-primary dropdown-toggle" aria-haspopup="true" aria-expanded="false">'+ title.title +' <span class="caret"></span><p class="select-value"></p></button>',
			              '<ul class="dropdown-menu time">',
			                '<li>',
				              	'<div class="filter_date-group"><div class="input-group date" id="start'+title.id+'">',
					        	'<input type="text" class="form-control"/>',
					        	'<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>',
					        	'</div></div>',
					        	' -- ',
					        	'<div class="filter_date-group"><div class="input-group date" id="end'+title.id+'">',
					        	'<input type="text" class="form-control"/>',
					        	'<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>',
					        	'</div></div><button class="btn btn-default time-search">搜索</button>',
				        	'</li>',
			              '</ul>',
			            '</div>'].join(''));
						
			that.$search.find('.' + groupName).append($html);
	
			if(!isEmptyObject(title.attributes)){
				for(var k in title.attributes){
					$html.find('input').attr(k,title.attributes[k]);
				}	
			}
	
			$html.find('.time-search').on('click',function(){
				$(this).parents('.btn-group').removeClass('open');
				showTimeData();
			});
	
			$html.find('.dropdown-toggle').on('click',function(event){
				event.stopPropagation();
				$('.btn-group').removeClass('open');
				$(this).parent().addClass('open');
			});
			
			$html.on('click',function(event){
				event.stopPropagation();
			});
			
			// 时间插件初始化
			$html.find('#start'+title.id).datetimepicker({
				locale: 'zh-cn',
				format: 'YYYY-MM-DD HH:mm',
				widgetPositioning: {
					horizontal: 'left',
			        vertical: 'auto'
				}
			});
			$html.find('#end'+title.id).datetimepicker({
				locale: 'zh-cn',
				format: 'YYYY-MM-DD HH:mm',
				widgetPositioning: {
					horizontal: 'left',
			        vertical: 'auto'
				}
			});
			
			$html.find('#start'+title.id).on("dp.change",function (e) {
				$html.find('#end'+title.id).data("DateTimePicker").minDate(e.date);
				
	        });
			
			$html.find("#end" + title.id).on("dp.change",function (e) {
	        	$html.find('#start'+title.id).data("DateTimePicker").maxDate(e.date);
	        });
			
			function showTimeData(){
				var _str = $.map($html.find('input'),function(item,index){
					return $(item).val().trim();
				}).join('-').replace(/(^-*)|(-*$)/g, '');
				
				if(_str !== '' && (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(_str) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}-\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(_str))){
					
					$html.find('button').addClass('on');
					$html.find('.select-value').html(_str);
				}else{
					$html.find('button').removeClass('on');
					$html.find('.select-value').html('');
					$html.find('input').val('');
				}
				
				if(_str != oldText){
					oldText = _str;
					that.options.change(that.getAll());
				}
			}
		}

	}

	// checkbox 改变时
	FilterBox.prototype.unlimited = function(){
		var that = this;
		that.$check.find('input[type="checkbox"]').on('change',function(){
			if($(this).parents('.filter_checkbox').hasClass('other') && $(this).prop('checked')){
					$(this).parents('.filter_checked-group').find('.filter_checkbox')
					.not('.other').find('input[type="checkbox"]')
					.prop('checked',false);
					$(this).attr('disabled','disabled');

			}else{
				$(this).parents('.filter_checkbox').siblings('.other').find('input[type="checkbox"]')
					.prop('checked',false).removeAttr('disabled');
			}

			if($(this).parents('.filter_checked-group').find('input:checked').length == 0){
				$(this).parents('.filter_checkbox').siblings('.other').find('input[type="checkbox"]')
					.prop('checked',true).attr('disabled',true);
			}

			that.options.change(that.getAll());
		});
	}
	
	// 返回已经选择了的参数
	FilterBox.prototype.getAll = function(){
		var that = this;

		// 获取选择数据
		var oData = {};
		var checkedLine =  that.$check.find('.filter_checked-line');
		for(var i=0; i<checkedLine.length; i++){
				var checked = $(checkedLine[i]).find('input[type="checkbox"]:checked');
				var _check = [];
				for(var j=0; j<checked.length; j++){
					var _d = {};
					if($(checked[j]).attr('data-val')){
						_d.value = $(checked[j]).attr('data-val');
						_d.label = $(checked[j]).parent().text();
					}else{
						_d.value = j;
						_d.label = $(checked[j]).parent().text();
					}
					_check.push(_d);
				}
				
				oData[$(checkedLine[i]).attr('data-filter-id')] = _check;
		}

		// 获取toolbar内数据
		var searches = that.$search.find('.search');
		var times = that.$search.find('.time');
		var chooses = that.$search.find('.choose');
		
		//搜索框数据
		for(var i=0; i<searches.length; i++){
			var searchVal = $(searches[i]).siblings('button').find('.select-value');
			if(searchVal.html() !== ''){
				var name = $(searches[i]).parent().attr('data-filter-id');
				
				oData[name] = searchVal.html();
			}
		}
		
		//时间数据
		for(var i=0; i<times.length; i++){
			var oTimes = {};
			if($(times[i]).find('input').eq(0).val() != ''){
				oTimes.startTime = $(times[i]).find('input').eq(0).val();
			}else{
				oTimes.startTime = '';
			}
			if($(times[i]).find('input').eq(1).val() != ''){
				oTimes.endTime = $(times[i]).find('input').eq(1).val();
			}else{
				oTimes.endTime = '';
			}
			
			var name = $(times[i]).parent().attr('data-filter-id');
			oData[name] = oTimes;
			
			
		}
		
		// 选择数据
		for(var i=0; i<chooses.length; i++){
			var chooseVal = $(chooses[i]).siblings('button').find('.select-value');
			if(chooseVal.html() !== ''){
				var _timeArr = [];
				var name = $(chooses[i]).parent().attr('data-filter-id');
				
				var chooseInputs = $(chooses[i]).find('input:checked');
				
				for(var j=0; j<chooseInputs.length; j++){
					var _time = {};
					_time.label = $(chooseInputs[j]).siblings('span').text();
					if($(chooseInputs[j]).attr('data-val')){
						_time.value = $(chooseInputs[j]).attr('data-val');
					}
					_timeArr.push(_time);
				}
				oData[name] = _timeArr;
			}
		}
		
		return oData;
	}


	// 清除
	FilterBox.prototype.clear = function(){
		var that = this;
		that.$check.find('input').removeAttr('checked');
		that.$check.find('.other').find('input').prop('checked',true);
		that.$check.find('.other').find('input').attr('disabled','disabled');
		that.$search.find('input').val('');
		that.$search.find('input').removeAttr('checked');
		that.$search.find('.select-value').html('').parent().removeClass('on');
		that.options.change(that.getAll());
	};
	
   FilterBox.EVENTS = {
  	 'getAll.bs.filter' : 'getAll',
  	 'clear.bs.filter' : 'clear'
   };

	var allowedMethods = [
	    'getAll','clear'
	];
	
	$.fn.FilterBox = function(option){
		var value,
        args = Array.prototype.slice.call(arguments, 1);
		
	    this.each(function () {
	        var $this = $(this),
	            data = $this.data('filterbox.filter'),
	            options = $.extend({}, FilterBox.DEFAULTS, $this.data(),
	                typeof option === 'object' && option);
	        
	        if (typeof option === 'string') {
	            if ($.inArray(option, allowedMethods) < 0) {
	                throw new Error("Unknown method: " + option);
	            }
	
	            if (!data) {
	                return;
	            }
	
	            value = data[option].apply(data, args);
	            
	            if (option === 'destroy') {
	                $this.removeData('filterbox.filter');
	            }
	        }
	
	        if (!data) {
	            $this.data('filterbox.filter', (data = new FilterBox(this, options)));
	        }
	    });
	
	    return typeof value === 'undefined' ? this : value;
	};
	 
})(jQuery,window)