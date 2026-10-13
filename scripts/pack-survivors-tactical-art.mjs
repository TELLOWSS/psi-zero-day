import sharp from 'sharp';
const source=process.argv[2];
if(!source)throw new Error('Selected tactical RGBA atlas path required');
const edges=[[0,384,768,1180,1536],[0,384,804,1190,1536]],sprites=[];
for(let cell=0;cell<8;cell++){
 const row=Math.floor(cell/4),col=cell%4,left=edges[row][col],width=edges[row][col+1]-left;
 const input=await sharp(source).extract({left,top:row*512,width,height:512}).resize(216,216,{fit:'inside'}).png().toBuffer();
 const size=await sharp(input).metadata();
 sprites.push({input,left:col*256+Math.floor((256-size.width)/2),top:row*256+Math.floor((256-size.height)/2)});
}
await sharp({create:{width:1024,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(sprites).webp({lossless:true}).toFile('public/assets/survivors/tactical-equipment-v1.webp');
