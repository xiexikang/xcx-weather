// pages/city/city.js
const db = wx.cloud.database();
const app = getApp();
let util = require('../../util/util.js');
let globalData = app.globalData;

Page({
  /**
   * 页面的初始数据
   */
  data: {
    imgUrl: globalData.imgUrl, //图片路径
    openid: '', //openid
    loading: true, //loading状态
    myCityList: [], //我的城市天气列表
    isShowPop: false, //弹窗状态
    valueText: '', //输入框的文字
    cityResultList: [], //搜索成功显示的城市列表
    chooseItem: '', //选中的城市
    topCityList: [], //热门城市
    isShowHotCity: true, //热门城市显示状态
    startX: 0, //开始坐标x
    startY: 0, //开始坐标y
    animSpread: {}, //展开动画
    animShrnk: {}, //收缩动画
  },

  //获取天气状况
  getWeather(location) {
    var params = {};
    params.location = location;
    params.key = globalData.key;
    return new Promise((resolve, reject) => {
      util.requestAjax.get('https://devapi.qweather.com/v7/weather/now', params)
        .then((res) => {
          if (res.data.code != 200) {
            return
          }
          const now = res.data.now;
          resolve(now)
        })
    })
  },

  //获取我的地址
  getMyCityWeater() {
    let that = this;
    util.showLoading('加载中...');
    db.collection('cityWeather').where({
      _openid: that.data.openid
    }).get({
      async success(res) {
        var result = res.data;
        if (result.length <= 0) {
          util.hideLoading();
          return
        }
        var myCityList = result[0].cityList;
        await myCityList.forEach(async (item) => {
          let val = await that.getWeather(item.location);
          item.temp = val.temp;
          item.time = util.formatHourMinute(val.obsTime);
          item.isTouchMove = false;
          that.setData({
            myCityList: myCityList,
            loading: false
          })
        })
      },
      fail(err) {
        console.log(err)
      }, complete(){
        util.hideLoading();
        wx.stopPullDownRefresh();
      }
    })
  },

  //添加城市
  addCityWeather() {
    let that = this;
    wx.cloud.callFunction({
      name: 'cityWeather',
      data: {
        chooseItem: that.data.chooseItem,
      },
      success(res) {
        var result = res.result,
          cityItem = result.event.chooseItem,
          openid = result.openid;
        db.collection('cityWeather').where({
          _openid: openid
        }).get().then(res => {
          const data = res.data;
          //没有自己-添加
          if (data.length <= 0) {
            var cityList = [];
            cityList.push(cityItem);
            console.log(cityList)
            db.collection('cityWeather').add({
              data: {
                cityList: cityList
              },
              success(res) {
                util.showSuccess('添加成功~');
                that.getMyCityWeater();
              },
            })
          } else {
            //有自己-更新
            var cityList = data[0].cityList,
              docId = data[0]._id;
            cityList.push(cityItem);
            db.collection('cityWeather').doc(docId).update({
              data: {
                cityList: cityList
              },
              success(res) {
                util.showSuccess('添加成功~');
                that.getMyCityWeater();
              }
            })
          }
        })
      },
      fail(err) {
        console.log(err)
      }
    })
  },

  //删除城市
  bindDelete(e) {
    var that = this,
      city = e.currentTarget.dataset.city,
      index = e.currentTarget.dataset.index,
      items = that.data.myCityList;
    items[index].isTouchMove = true;
    that.setData({
      myCityList: items
    })
    wx.showModal({
      title: '温馨提示',
      content: '亲，您确定要删除当前城市吗？',
      success(res) {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'cityWeather',
            data: {
              city: city
            },
            success(res) {
              db.collection('cityWeather').where({
                _openid: that.data.openid
              }).get().then(res => {
                const data = res.data;
                if (data.length > 0) {
                  var cityList = data[0].cityList,
                    docId = data[0]._id;
                  cityList.splice(index, 1);
                  db.collection('cityWeather').doc(docId).update({
                    data: {
                      cityList: cityList
                    },
                    success(res) {
                      items.splice(index, 1);
                      that.setData({
                        myCityList: items
                      })
                      util.showSuccess('删除成功~');
                    }
                  })
                }
              })
            }
          })
        } else if (res.cancel) {
          items[index].isTouchMove = false;
          that.setData({
            myCityList: items
          })
        }
      }
    })
  },

  //获取热门城市
  getHotCity() {
    let params = {
      key: globalData.key,
      number: 12,
    }
    util.requestAjax.get('https://geoapi.qweather.com/v2/city/top', params)
      .then((res) => {
        if (res.data.code != 200) {
          return
        }
        this.setData({
          topCityList: res.data.topCityList
        })
      });
  },

  //搜索城市-键盘输入监听
  bindSearchInput(e) {
    let value = e.detail.value;
    this.setData({
      valueText: value
    })
    if (!value) {
      this.setData({
        cityResultList: [],
        isShowHotCity: true
      })
      return
    }
    let params = {
      key: globalData.key,
      location: value,
      number: 20
    };
    util.requestAjax.get('https://geoapi.qweather.com/v2/city/lookup', params)
      .then((res) => {
        if (res.data.code != 200) {
          this.setData({
            cityResultList: [],
            isSearchNone: true,
            isShowHotCity: false
          })
          return
        }
        const data = res.data.location;
        this.setData({
          cityResultList: data,
          isSearchNone: false,
          isShowHotCity: false
        })
      })
  },

  //搜索列表中的-选中该城市
  bindChoose(e) {
    let chooseItem = {
      cityName: e.currentTarget.dataset.cityname,
      location: `${e.currentTarget.dataset.longitude},${e.currentTarget.dataset.latitude}`
    }
    this.setData({
      chooseItem: chooseItem
    })
    this.addCityWeather();
    this.bindAddPopHide();
  },

  //我的城市集中-选择
  bindSelect(e) {
    globalData.cityName = e.currentTarget.dataset.cityname;
    globalData.location = e.currentTarget.dataset.location;
    wx.switchTab({
      url: '../weather/weather',
      success(e) {
        var page = getCurrentPages().pop();
        if (page == undefined || page == null) return;
        page.onLoad();
      }
    })
  },

  //打开弹窗
  bindAddPopShow() {
    var animSpread = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    var animShrnk = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    animSpread.bottom(0).step();
    animShrnk.translateY(15).scale(0.92).step();
    this.setData({
      animSpread: animSpread.export(),
      animShrnk: animShrnk.export(),
      isShowPop: true
    })
  },

  //隐藏弹窗-
  bindAddPopHide() {
    let that = this;
    var animSpread = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    var animShrnk = wx.createAnimation({
      duration: 300,
      delay: 0,
      timingFunction: "ease",
    });
    animSpread.bottom(-95 + '%').step();
    animShrnk.translateY(0).scale(1).step();
    that.setData({
      animSpread: animSpread.export(),
      animShrnk: animShrnk.export(),
      isShowPop: false,
      valueText: '',
      cityResultList: [],
      isShowHotCity: true
    })
  },

  //开始触摸时
  touchstart(e) {
    var that = this;
    var items = that.data.myCityList;
    items.forEach(function (v, i) {
      if (v.isTouchMove) {
        v.isTouchMove = false;
      }
    })
    that.setData({
      startX: e.changedTouches[0].clientX,
      startY: e.changedTouches[0].clientY,
      myCityList: that.data.myCityList
    })
  },

  //滑动事件处理
  touchmove(e) {
    var that = this,
      items = that.data.myCityList,
      index = e.currentTarget.dataset.index, //当前索引
      startX = that.data.startX, //开始X坐标
      startY = that.data.startY, //开始Y坐标
      touchMoveX = e.changedTouches[0].clientX, //滑动变化坐标
      touchMoveY = e.changedTouches[0].clientY, //滑动变化坐标
      //获取滑动角度
      angle = that.angle({
        X: startX,
        Y: startY
      }, {
        X: touchMoveX,
        Y: touchMoveY
      });

    items.forEach(function (v, i) {
      v.isTouchMove = false
      //滑动超过30度角 return
      if (Math.abs(angle) > 30) return;
      if (i == index) {
        if (touchMoveX > startX) {
          v.isTouchMove = false; //右滑
        } else {
          v.isTouchMove = true; //左滑
        }
      }
    })
    that.setData({
      myCityList: that.data.myCityList
    })
  },

  // 计算滑动角度 start 起点坐标  end 终点坐标
  angle(start, end) {
    var _X = end.X - start.X,
      _Y = end.Y - start.Y
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },

  //初始化
  async init() {
    const openid = await app.getOpenid(); //获取openid
    this.setData({
      openid: openid
    })
    this.getMyCityWeater();
    this.getHotCity();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.init();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.bindAddPopHide();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.bindAddPopHide();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.init();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})