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

    this.getOpenid();
    this.autoUserLocation();

  },

  //获取openid顺序：globalData--storage--云函数login
  getOpenid: async function () {
    (this.globalData.openid = this.globalData.openid || wx.getStorageSync('openid')) || wx.setStorageSync('openid', this.globalData.openid = (await wx.cloud.callFunction({ name: 'login' })).result.openid)
    return this.globalData.openid
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
          console.log('位置未授权')
          that.globalData.is_Address = 0;
          wx.authorize({
            scope: 'scope.userLocation',
            success(res){
              that.getWxLocation();
            },
            fail(res){
              console.log('~~取消位置授权~~')
              wx.showModal({
                  title:'定位失败',
                  content:'请允许”使用我的地理位置“后，再查看定位城市信息，默认为您展示广州的天气信息。',
                  showCancel:false,
                  success(res) {
                    if (res.confirm) {
                      wx.openSetting({
                        success: (ret) => {
                          if(ret.authSetting['scope.userLocation']){
                            that.getWxLocation();
                          }else{
                            //返回-回调
                            if (that.isCancleCallback){
                              that.isCancleCallback(ret);
                             }
                          }
                         }
                      })
                   }
                }
              })
            }
          })
        }else{
          console.log('位置已授权')
          that.getWxLocation();
        }
      }
    })
  },


  globalData:{
    openid:'',
    keepscreenon:false,
    systeminfo: {},
    isIPhoneX: false,
    key: '',//和风天气的key,自行去官方配置哈，否则无法运行
    requestUrl: {
      weather: 'https://free-api.heweather.net/s6/weather/',
      weatherNow: 'https://free-api.heweather.net/s6/weather/now/',
      cityFind:'https://search.heweather.net/find/',
      cityHot:'https://search.heweather.net/top/',
      searchKeywords:'https://apis.map.qq.com/',
    },
    isLocation: 0, //是否已授权地理位置 用于callback回调的
    is_Address: 0, //用于判断的授权状态的 0否，1是
    city: null, //选中的城市
  },
 

})
