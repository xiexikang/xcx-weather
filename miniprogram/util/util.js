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


module.exports = {
  requestAjax : requestAjax,
  formatTime : formatTime,
  formatDate: formatDate,
  formatWeek: formatWeek,
  formatWeekday : formatWeekday
}