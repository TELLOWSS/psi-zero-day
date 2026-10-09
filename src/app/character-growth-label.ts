import copy from '../../content/localization/character-growth-ko.json';
export function characterGrowthExpressionLabel(expression:string):string|undefined {
 return Object.hasOwn(copy,expression)?copy[expression as keyof typeof copy]:undefined;
}
