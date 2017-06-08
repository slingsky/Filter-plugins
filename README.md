# 说明
	一款基于bootstrap的筛选插件，仅用于学习交流。


## 配置参数

url 请求链接 返回data

data: null // 传入数据数据 {}

clearBtn: true, // 是否显示清除按钮

title: [] 筛选参数配置 

  	field: undefined, // 提取对应data里的属性
  
	title: undefined, // 筛选类别标题
	
	type: undefined, // 生成筛选类型 cheack,search,time,choose
	
	label: undefined, // 生成复选框与下拉选择框所对应的属性名
	
	attributes: null, // 自定义属性 {}
	
	splitArray: null, // 生成复选框数据时分组参数 []，仅当type为cheack时生效
	
	groupName: 'group', // 下拉类型选择分组组名
	
	value: undefined, // 筛选框value值
	
	unlimitedName: '不限',
	
	searchBoxUrl: undefined, // 查询及时生成下查询下拉列表，仅当类型为search时生效 
	
	searchBoxName: undefined, // 查询参数所对应的key值 默认为data.result.name
	
	queryParams: function(params){ // 自定义查询参数 默认为当前输入框的value
	
		return params;
		
	}

change: function(checkes){return false;}  // 但选项改变是触发

clearBack: function(){ return false;} // 点击清除按钮的返回函数

## 方法

$filter.FilterBox('getAll') // 获取全部已选择的选项

$filter.FilterBox('clear') // 清空筛选项
