async function view(page,id){
 const button=page.locator('.workbench-views [data-workbench-view="'+id+'"]');
 if(await button.getAttribute('aria-pressed')!=='true')await button.click();
}
async function part(page,key){
 await view(page,'setup');
 const button=page.locator('#rig-part-'+key);
 if(await button.getAttribute('aria-pressed')!=='true')await button.click();
}
async function item(page,key){
 await view(page,'packing');
 await page.locator('.inventory-grid [data-inventory-item="'+key+'"]').click();
}
module.exports={view,part,item};
