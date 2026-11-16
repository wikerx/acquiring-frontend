import assert from 'node:assert/strict';
import test from 'node:test';
import { detectImageFormat, IMAGE_UPLOAD_MAX_BYTES, validateImageFile } from '../src/imageUpload.ts';
const png = Uint8Array.from([137,80,78,71,13,10,26,10,0]);
const jpg = Uint8Array.from([255,216,255,224,0]);
const webp = Uint8Array.from([82,73,70,70,20,0,0,0,87,69,66,80,86,80,56,32]);
test('renamed WebP reports its actual format and remains rejected', async () => {
    assert.deepEqual(await validateImageFile(new File([webp], 'Mastercard_2019_logo.png', {type:'image/png'})), {valid:false,reason:'unsupported',actual:'WebP'});
});
test('supported PNG and JPEG content is accepted including missing browser MIME', async () => {
    for (const [bytes,name,type,format] of [[png,'a.png','image/png','PNG'],[jpg,'a.jpeg','image/jpeg','JPEG'],[png,'a.PNG','','PNG']]) assert.deepEqual(await validateImageFile(new File([bytes],name,{type})),{valid:true,format});
});
test('unsupported real formats are distinguished from corrupt content', async () => {
    for (const [bytes,format] of [[webp,'WebP'],[new TextEncoder().encode('GIF89a'),'GIF'],[new TextEncoder().encode('<svg xmlns="x">'),'SVG']]) {
        assert.equal(detectImageFormat(bytes),format);
        assert.deepEqual(await validateImageFile(new File([bytes],'a.png',{type:'image/png'})),{valid:false,reason:'unsupported',actual:format});
    }
    assert.deepEqual(await validateImageFile(new File(['not an image'],'a.png',{type:'image/png'})),{valid:false,reason:'content'});
});
test('wrong extension and forged MIME remain rejected for valid image headers', async () => {
    assert.deepEqual(await validateImageFile(new File([jpg],'a.png',{type:'image/png'})),{valid:false,reason:'extension',actual:'JPEG'});
    assert.deepEqual(await validateImageFile(new File([png],'a.png',{type:'image/jpeg'})),{valid:false,reason:'mime',actual:'PNG'});
});
test('size limit is independent from format feedback and includes the boundary', async () => {
    assert.deepEqual(await validateImageFile(new File([],'a.png',{type:'image/png'})),{valid:false,reason:'empty'});
    const bytes = new Uint8Array(IMAGE_UPLOAD_MAX_BYTES);bytes.set(png);
    assert.equal((await validateImageFile(new File([bytes],'a.png',{type:'image/png'}))).valid,true);
    assert.deepEqual(await validateImageFile(new File([bytes,new Uint8Array(1)],'a.png',{type:'image/png'})),{valid:false,reason:'size'});
});
test('file read failures are reported without unhandled exceptions', async () => {
    const file = {size:1,slice:()=>({arrayBuffer:()=>Promise.reject(new Error('denied'))})};
    assert.deepEqual(await validateImageFile(file),{valid:false,reason:'read'});
});
