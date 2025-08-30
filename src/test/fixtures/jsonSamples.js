/**
 * 测试用JSON样本数据
 */

// 基础注释样本
export const basicComments = `{
  "name": "test", // 这是姓名
  "age": 25, /* 这是年龄 */
  "city": "北京"
}`;

// 复杂嵌套注释样本
export const complexComments = `{
  "activityCardViewList" : { // 活动卡片列表

  "upcomingActivityCardViewList": [{ // 即将到来的活动
    "top": { // 帽子区：系列赛/部分活动有
      "title": { // 标题，系列赛/报名活动有
        "template": "系列赛|赛1·冬季活动跑单礼",
        "dynamicKeys": []
      },
      "link": { 
        "type": "link", // 可以是button、icon、text、link、tag
        "template": "查看全部"
      } // 链接，系列赛有
    },
    "isCollapsible": 0 // 报名活动&报名名额已满/报名已结束的列表
  }] // 数组结束
  },
  "listTitleExtension": null
}`;

// 大数字样本
export const bigNumbers = `{
  "smallNumber": 123,
  "bigNumber": 1753586062170048662,
  "anotherBigNumber": 9223372036854775807,
  "normalString": "hello",
  "nested": {
    "hugeBigNumber": 99999999999999999999
  },
  "array": [1, 1753586062170048662, "text"]
}`;

// 各种括号注释样本
export const bracketComments = `{
  "object": { // 对象开始
    "key1": "value1",
    "key2": "value2"
  }, // 对象结束
  "array": [ // 数组开始
    "item1",
    "item2"
  ], // 数组结束
  "empty": {}
}`;

// 混合注释类型
export const mixedComments = `{
  "lineComment": "value", // 行注释
  "blockComment": "value", /* 块注释 */
  "nested": {
    "another": "value" /* 另一个块注释 */
  }, // 结束注释
  "array": [
    "item1", // 数组项注释
    "item2" /* 数组项块注释 */
  ]
}`;

// 无注释的纯JSON
export const pureJSON = `{
  "name": "test",
  "age": 25,
  "city": "北京",
  "hobbies": ["reading", "coding"],
  "address": {
    "street": "Main St",
    "number": 123
  }
}`;

// 压缩的JSON
export const compressedJSON = `{"name":"test","age":25,"city":"北京"}`;

// 无效的JSON样本
export const invalidJSON = `{
  "name": "test",
  "age": 25,
  "city": "北京"
  // 缺少结束括号`;

// 带转义字符的JSON
export const escapedJSON = `{
  "message": "Hello \\"World\\"",
  "path": "C:\\\\Users\\\\test",
  "newline": "Line1\\nLine2"
}`;

// 特殊字符JSON
export const specialCharsJSON = `{
  "chinese": "你好世界",
  "emoji": "😀🚀",
  "unicode": "\\u4e2d\\u6587",
  "symbols": "!@#$%^&*()"
}`;

// Java toString样本
export const javaToString = `User{name=张三, age=25, city=北京, hobbies=[reading, coding]}`;

// 复杂的实际业务JSON（简化版）
export const businessJSON = `{
  "activityCardViewList": {
    "upcomingActivityCardViewList": [{
      "top": { // 帽子区
        "title": { // 标题
          "template": "冬季活动",
          "dynamicKeys": []
        }
      },
      "operation": { 
        "type": "icon", // 操作类型
        "template": "",
        "disabled": false,
        "iconRef": ["http://example.com"],
        "action": null
      } // 操作区
    }]
  },
  "listTitleExtension": null
}`;

// 测试数据集合
export const testSamples = {
  basicComments,
  complexComments,
  bigNumbers,
  bracketComments,
  mixedComments,
  pureJSON,
  compressedJSON,
  invalidJSON,
  escapedJSON,
  specialCharsJSON,
  javaToString,
  businessJSON
};

// 期望结果（用于验证）
export const expectedResults = {
  // 基础注释格式化后应该保留注释
  basicCommentsFormatted: {
    shouldContain: ['// 这是姓名', '/* 这是年龄 */'],
    shouldNotContain: []
  },
  
  // 大数字应该保持精度
  bigNumbersFormatted: {
    shouldContain: ['1753586062170048662', '9223372036854775807'],
    shouldNotContain: ['1.7535860621700487e+18', '9.223372036854776e+18']
  }
};