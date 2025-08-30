/**
 * 复杂场景端到端测试
 * 测试原始问题中提到的各种复杂注释场景
 */

import { describe, it, expect } from 'vitest';
import { formatJson, removeComments, hasComments } from '@/utils/jsonAstUtils.js';
import { assertions, countComments } from '../helpers/testUtils.js';

describe('复杂场景端到端测试', () => {
  // 原始问题中的复杂JSON
  const originalComplexJSON = `{
  "activityCardViewList" : {

  "upcomingActivityCardViewList": [{
    "top": { // 帽子区：系列赛/部分活动有
      "title": { // 标题，系列赛/报名活动有
        "template": "系列赛|赛1·冬季活动跑单礼",
        "dynamicKeys": []
      },
      "link": { 
        "type": "link", // 可以是button、icon、text、link、tag
        "template": "查看全部", // 为text、button、link、tag时的文案
        "dynamicKeys": [], // 为text、button、navigationLink、tag时的动态变量，和textTemplate搭配使用
        "iconRef": [], // 为icon时，用的链接
        "disabled": false, // 是否可点
        "tip": "", // 小标题
        "action": { // 点击后的行为
          "data": {
            "innerLink": "1",
            "url": "homebrew%3A%2F%2Fbanma.meituan.com%2Fmrn%3Fmrn_biz%3Dbanma%26mrn_entry%3Dnero-1090-qiandao-20348%26mrn_component%3Dnero-1090-qiandao-20348%26instanceId%3D3018946148478991700"
          },
          "pageType": 9,
          "target": "banma://homebrew/mrn"
        }
      }, // 链接，系列赛有
      "tag": [ // 活动标签  
        {
          "template": "提前报名奖励翻倍中",
          "dynamicKeys": []
        },
        {
          "template": "0.6倍奖励升级卡生效中",
          "dynamicKeys": []
        }
    ],
      "theme": { // 主题，系列赛有
        "color": "#FF6600 100%"
      }
    },
    "isCollapsible": 0 //报名活动&报名名额已满/报名已结束的列表isCollapsible为1（是），其他为0（否）
}]
},
"listTitleExtension": null,
  "activityMallCardView": {
    "operation": { 
        "type": "button", // 可以是button、icon、text、link、tag
        "template": "去报名", // 为text、button、link、tag时的文案
        "action": { // 点击后的行为
          "data": {
            "innerLink": "1"
          },
          "pageType": 9,
          "target": "banma://homebrew/mrn"
        }
      } // 商城卡操作区
  },
  "degradePlan": null,
  "historyRemind": null
}`;

  // 包含各种括号注释的测试用例
  const bracketCommentsScenarios = [
    {
      name: '左大括号后的注释',
      json: `{
  "object": { // 这是对象开始
    "key": "value"
  }
}`
    },
    {
      name: '右大括号后的注释',
      json: `{
  "object": {
    "key": "value"
  } // 这是对象结束
}`
    },
    {
      name: '左方括号后的注释',
      json: `{
  "array": [ // 这是数组开始
    "item1",
    "item2"
  ]
}`
    },
    {
      name: '右方括号后的注释',
      json: `{
  "array": [
    "item1",
    "item2"
  ] // 这是数组结束
}`
    },
    {
      name: '右大括号逗号后的注释',
      json: `{
  "obj1": {
    "key": "value"
  }, // 第一个对象结束
  "obj2": {
    "key": "value"
  }
}`
    },
    {
      name: '右方括号逗号后的注释',
      json: `{
  "arr1": [
    "item"
  ], // 第一个数组结束
  "arr2": [
    "item"
  ]
}`
    }
  ];

  describe('原始问题场景测试', () => {
    it('应该完美处理原始复杂JSON的所有注释场景', () => {
      const result = formatJson(originalComplexJSON);

      // 验证基本功能
      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(originalComplexJSON, result);

      // 验证特定的注释场景
      expect(result).toContain('// 帽子区：系列赛/部分活动有');
      expect(result).toContain('// 标题，系列赛/报名活动有');
      expect(result).toContain('// 可以是button、icon、text、link、tag');
      expect(result).toContain('// 链接，系列赛有');
      expect(result).toContain('// 活动标签');
      expect(result).toContain('// 主题，系列赛有');
      expect(result).toContain('// 商城卡操作区');
      expect(result).toContain('//报名活动&报名名额已满/报名已结束的列表');

      // 验证结构完整性
      expect(result).toContain('"activityCardViewList"');
      expect(result).toContain('"upcomingActivityCardViewList"');
      expect(result).toContain('"activityMallCardView"');
      expect(result).toContain('"listTitleExtension": null');
    });

    it('应该保持JSON结构的语义完整性', () => {
      const formatted = formatJson(originalComplexJSON);
      const withoutComments = removeComments(formatted);
      const parsed = JSON.parse(withoutComments);

      // 验证关键结构
      expect(parsed.activityCardViewList).toBeDefined();
      expect(parsed.activityCardViewList.upcomingActivityCardViewList).toBeInstanceOf(Array);
      expect(parsed.activityCardViewList.upcomingActivityCardViewList[0].top).toBeDefined();
      expect(parsed.activityMallCardView).toBeDefined();
      expect(parsed.listTitleExtension).toBe(null);
    });
  });

  describe('各种括号注释场景测试', () => {
    bracketCommentsScenarios.forEach(scenario => {
      it(`应该正确处理${scenario.name}`, () => {
        const result = formatJson(scenario.json);

        // 验证基本功能
        assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
        assertions.preservesComments(scenario.json, result);

        // 验证注释被保留
        expect(hasComments(result)).toBe(true);
        
        // 验证注释数量不减少
        const originalCommentCount = countComments(scenario.json);
        const resultCommentCount = countComments(result);
        expect(resultCommentCount).toBeGreaterThanOrEqual(originalCommentCount);
      });
    });
  });

  describe('深度嵌套注释场景', () => {
    const deeplyNestedJSON = `{
  "level1": { // 第一层
    "level2": { // 第二层
      "level3": { // 第三层
        "level4": { // 第四层
          "data": [
            { // 数组项1
              "id": 1,
              "value": "test1"
            }, // 数组项1结束
            { // 数组项2
              "id": 2,
              "value": "test2"
            } // 数组项2结束
          ] // 数据数组结束
        } // 第四层结束
      } // 第三层结束
    } // 第二层结束
  } // 第一层结束
}`;

    it('应该处理深度嵌套的注释结构', () => {
      const result = formatJson(deeplyNestedJSON);

      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(deeplyNestedJSON, result);

      // 验证各层注释都被保留
      expect(result).toContain('// 第一层');
      expect(result).toContain('// 第二层');
      expect(result).toContain('// 第三层');
      expect(result).toContain('// 第四层');
      expect(result).toContain('// 数组项1');
      expect(result).toContain('// 数组项2');
      expect(result).toContain('// 数据数组结束');
    });
  });

  describe('混合注释类型场景', () => {
    const mixedCommentTypesJSON = `{
  "lineComment": "value", // 行注释
  "blockComment": "value", /* 块注释 */
  "object": { // 对象开始
    "nested": "value" /* 嵌套块注释 */
  }, // 对象结束
  "array": [ // 数组开始
    "item1", // 项目1
    "item2" /* 项目2 */
  ] /* 数组结束 */
}`;

    it('应该处理混合注释类型', () => {
      const result = formatJson(mixedCommentTypesJSON);

      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(mixedCommentTypesJSON, result);

      // 验证各种注释类型都被保留
      expect(result).toContain('// 行注释');
      expect(result).toContain('/* 块注释 */');
      expect(result).toContain('// 对象开始');
      expect(result).toContain('/* 嵌套块注释 */');
      expect(result).toContain('// 项目1');
      expect(result).toContain('/* 项目2 */');
    });
  });

  describe('大数字与注释结合场景', () => {
    const bigNumberWithCommentsJSON = `{
  "regularNumber": 123, // 普通数字
  "bigInteger": 1753586062170048662, // 大整数，需要保持精度
  "anotherBigNumber": 9223372036854775807, /* 另一个大数字 */
  "nested": {
    "hugeBigNumber": 99999999999999999999 // 超大数字
  }, // 嵌套对象结束
  "arrayWithBigNumbers": [ // 包含大数字的数组
    1,
    1753586062170048662, // 数组中的大数字
    "text"
  ] // 数组结束
}`;

    it('应该同时处理大数字精度和注释保留', () => {
      const result = formatJson(bigNumberWithCommentsJSON);

      // 验证大数字精度
      assertions.containsBigNumber(result, '1753586062170048662');
      assertions.containsBigNumber(result, '9223372036854775807');
      assertions.containsBigNumber(result, '99999999999999999999');

      // 验证注释保留
      assertions.preservesComments(bigNumberWithCommentsJSON, result);
      expect(result).toContain('// 普通数字');
      expect(result).toContain('// 大整数，需要保持精度');
      expect(result).toContain('/* 另一个大数字 */');
      expect(result).toContain('// 超大数字');
      expect(result).toContain('// 包含大数字的数组');
      expect(result).toContain('// 数组中的大数字');

      // 验证结果是有效的JSON（去除注释后）
      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
    });
  });

  describe('性能和稳定性测试', () => {
    it('应该处理大型复杂JSON文件', () => {
      // 创建一个大型的复杂JSON
      const largeJSON = generateLargeComplexJSON(100); // 100个复杂对象
      
      const startTime = Date.now();
      const result = formatJson(largeJSON);
      const endTime = Date.now();

      // 验证结果正确性
      assertions.isValidJSON(result.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''));
      assertions.preservesComments(largeJSON, result);

      // 验证性能（应该在合理时间内完成）
      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(5000); // 5秒内完成

      console.log(`处理包含 ${countComments(largeJSON)} 个注释的大型JSON耗时: ${processingTime}ms`);
    });

    it('应该能重复格式化保持幂等性', () => {
      const first = formatJson(originalComplexJSON);
      const second = formatJson(first);
      const third = formatJson(second);

      // 多次格式化应该产生相同结果
      expect(normalizeWhitespace(second)).toBe(normalizeWhitespace(third));
      
      // 注释数量应该保持一致
      expect(countComments(first)).toBe(countComments(second));
      expect(countComments(second)).toBe(countComments(third));
    });
  });
});

/**
 * 生成大型复杂JSON用于性能测试
 */
function generateLargeComplexJSON(count) {
  const items = [];
  
  for (let i = 0; i < count; i++) {
    items.push(`{
      "id": ${i}, // 项目ID
      "name": "item${i}", /* 项目名称 */
      "metadata": { // 元数据
        "created": "2025-01-01",
        "tags": [ // 标签数组
          "tag1",
          "tag2" // 标签2
        ] // 标签结束
      }, // 元数据结束
      "bigNumber": ${1753586062170048000 + i} // 大数字：${1753586062170048000 + i}
    }`);
  }
  
  return `{
  "items": [ // 项目列表
    ${items.join(',\n    ')}
  ] // 列表结束
}`;
}

/**
 * 标准化空白字符用于比较
 */
function normalizeWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}