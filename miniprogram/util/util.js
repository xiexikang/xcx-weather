//请求方法
const requestAjax = {
  get (url,data) {
    return new Promise((resolve,reject) => {
      wx.request({
        method: 'get',
        url: url,
        data: data,
        header: {"content-type": "application/json"},
        success: (res) =>{
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  post (url,data) {
    return new Promise((resolve,reject) => {
      wx.request({
        method: 'post',
        url: url,
        data: data,
        header: {"content-type": "application/x-www-form-urlencoded"},
        success: (res) =>{
          resolve(res)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
}

// 具体时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  // return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}


//得到时间格式2020-01-10
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year,month, day].map(formatNumber).join('-') 
}


//周几
const formatWeekday = date => {
  const weekday = "星期" + "日一二三四五六".charAt(date.getDay());
  return weekday
}

//转换周几，date: 2010-01-10
const formatWeek  = date => {
  const weekDay = ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];  
  var myDate = new Date(Date.parse(date));  
  const week = weekDay[myDate.getDay()];
  return week 
}

//时间转换为小时
const turnHour = date => {
  var hour = date.substr(11,2);
  return hour
}

//转换时间
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

// 显示繁忙提示
const showBusy = text => wx.showToast({
  title: text,
  icon: 'loading',
  duration: 10000
})

// 显示加载中
const showLoading = text =>wx.showLoading({
  title: text,
  icon: 'loading',
  duration: 1200
})

// 显示普通提示
const showTip = text => wx.showToast({
  title: text,
  icon: 'none',
  duration: 1000
})

// 显示成功提示
const showSuccess = text => wx.showToast({
  title: text,
  icon: 'success',
  duration: 1000
})

// 显示失败提示
const showModel = (title, content) => {
  wx.hideToast();
  wx.showModal({
    title,
    content: JSON.stringify(content),
    showCancel: false
  })
}

//普通页面跳转
const pageJump = url => setTimeout(()=>{
  wx.navigateTo({
    url: url
  })
},1e3)

//主菜单页
const pageMenu = url => setTimeout(()=>{
  wx.switchTab({
    url: url
  })
},1e3)


// 分享
const shareEvent = (option, obj) => {
  let shareObj = {
    title: obj.title,
    path: obj.path,
    imageUrl: obj.imageUrl,
    success(res) {
      if (res.errMsg == 'shareAppMessage:ok') {

        }
    },
    fail(res) {
      if (res.errMsg == 'shareAppMessage:fail cancel') {

      } else if (res.errMsg == 'shareAppMessage:fail') {
      
      }
    },
    complete(res) {

    }
  };

  // 来自页面内转发按钮
  if (option.from === 'button') {
    // console.log(option.target)

  }
  return shareObj;
  }


module.exports = {
  requestAjax : requestAjax,
  formatTime : formatTime,
  formatDate: formatDate,
  formatWeek: formatWeek,
  formatWeekday : formatWeekday,
  turnHour : turnHour,
  showBusy: showBusy, 
  showLoading: showLoading, 
  showTip: showTip, 
  showSuccess: showSuccess, 
  showModel: showModel, 
  shareEvent: shareEvent,
  pageJump: pageJump,
  pageMenu: pageMenu 
}