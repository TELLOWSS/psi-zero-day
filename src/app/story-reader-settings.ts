export interface StoryReaderSettings {fontScale:number;music:number;ambience:number;effects:number;voice:number;}
export const STORY_READER_KEY='psi.story.reader.v1';
export const DEFAULT_STORY_READER:StoryReaderSettings={fontScale:1,music:.65,ambience:.75,effects:.55,voice:1};
export function normalizeStoryReader(raw:unknown):StoryReaderSettings {
  const v=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};
  const n=(key:keyof StoryReaderSettings,min:number,max:number)=>typeof v[key]==='number'&&Number.isFinite(v[key])?Math.max(min,Math.min(max,v[key] as number)):DEFAULT_STORY_READER[key];
  return {fontScale:n('fontScale',.9,1.35),music:n('music',0,1),ambience:n('ambience',0,1),effects:n('effects',0,1),voice:n('voice',0,1)};
}
export function loadStoryReader():StoryReaderSettings {try{return normalizeStoryReader(JSON.parse(localStorage.getItem(STORY_READER_KEY)??'null'));}catch{return {...DEFAULT_STORY_READER};}}
export function saveStoryReader(value:StoryReaderSettings):boolean {try{localStorage.setItem(STORY_READER_KEY,JSON.stringify(normalizeStoryReader(value)));return true;}catch{return false;}}
