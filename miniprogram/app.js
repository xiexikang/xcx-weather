//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }

    this.getOpenId();
    this.autoUserLocation();
  },

  //获取openId
  getOpenId(){
    let that = this;
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success(res) {
        wx.setStorageSync('openid', res.result.openid)
      }
    })
  },

  //获取用户微信地址
  getWxLocation(){
    let that = this;
    wx.getLocation({
      type: 'gcj02', 
      success (res) {
        const myLocationAddress = `${res.latitude},${res.longitude}`;
        wx.setStorageSync('myLocationAddress', myLocationAddress);
        that.globalData.is_Address = 1;
        that.globalData.isLocation = res;
        if (that.isLocationCallback){
          that.isLocationCallback(res);
         }
      }
     })
  },

  //授权用户位置-先判断
  autoUserLocation(){
    let that = this;
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          console.log('未授权')
          that.globalData.is_Address = 0;
          wx.authorize({
            scope: 'scope.userLocation',
            success(res){
              that.getWxLocation();
            },
            fail(res){
              console.log('~~取消授权~~')
              wx.showModal({
                  title:'定位失败',
                  content:'请允许”使用我的地理位置“后，再查看定位城市信息，小猪默认为您展示广州天气信息。',
                  success(res) {
                    if (res.cancel) {
                      console.log('点击取消');
                   } else {
                    wx.openSetting({
                      success: (ret) => {
                        if(ret.authSetting['scope.userLocation']){
                          that.getWxLocation();
                        }else{}
                       }
                    })
                  }
                }
              })
            }
          })
        }else{
          console.log('已授权')
          that.getWxLocation();
        }
      }
    })
  },

  globalData:{
    // 是否保持常亮，离开小程序失效
    keepscreenon:false,
    systeminfo: {},
    isIPhoneX: false,
    key: '01958cf7f6f44fe6a3e9d22a7743836b',
    mapKey: "MKWBZ-IH53W-NGSRB-OTOS7-2SW52-AHBOI",
    weatherIconUrl: 'https://cdn.heweather.com/cond_icon/',
    requestUrl: {
      weather: 'https://free-api.heweather.net/s6/weather/',
      weatherNow: 'https://free-api.heweather.net/s6/weather/now/',
      cityFind:'https://search.heweather.net/find/',
      cityHot:'https://search.heweather.net/top/',
      searchKeywords:'https://apis.map.qq.com/',
    },
    isLocation: 0, //是否已授权地理位置 用于callback回调的
    is_Address: 0, //用于判断的授权状态的 0否，1是
  }

})
