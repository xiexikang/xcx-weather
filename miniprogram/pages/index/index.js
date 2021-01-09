// pages/index/index.js
const db = wx.cloud.database();
const app = getApp();
let util = require('../../util/util.js');
let globalData = app.globalData;

Page({

  /**
   * 页面的初始数据
   */
  data: {
    imgUrl:'../../images',//图片路径
  },


  //检测跳转判断, 这个是点击 返回后回调
  jumpJudge(){
    app.isCancleCallback = res =>{
      if(res){
        util.pageMenu('../weather/weather');
      }
    }
  },

  //获取用户的授权定位 判断  
  getMyAutoLocation(){
    if (globalData.isLocation) {
        util.pageMenu('../weather/weather');
     } else {  
      // 由于 getLocation 是网络请求，可能会在 Page.onLoad 之后才返回 ; 所以此处加入 callback 以防止这种情况
      app.isLocationCallback = res => {
       if (res) {
          util.pageMenu('../weather/weather');
       }
      }
      this.jumpJudge();
     }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  
  //清除缓存一下
  removeIndex(){
    wx.removeStorageSync('isIndex'); 
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
 
    this.getMyAutoLocation();
   
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.removeIndex();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    this.removeIndex();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

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