// Step 1: Read and parse your JSON files
const fs = require('fs').promises;
const path = require('path');
const {logger} = require('../logger');
async function loadGameData() {
  try {
    // Define file paths
    const itemsFilePath = path.join(__dirname, '..','..','data', 'iteminfo.json');
    const weaponsFilePath = path.join(__dirname,'..','..', 'data', 'itemweaponsInfo.json');
    
    // Load all three files
    const itemsInfo = JSON.parse(await fs.readFile(itemsFilePath, 'utf8'));
    const weaponsInfo = JSON.parse(await fs.readFile(weaponsFilePath, 'utf8'));
    
    return { itemsInfo, weaponsInfo };
  } catch (error) {
    console.error('Error loading files:', error);
    throw error;
  }
}


// Transform field names to human-friendly format
function transformFieldNames(item, iconData = null) {
  return {
    itemId: item.ii_id,
    itemName: item.ii_name,
    itemOption: item.ii_name_option,
    itemDuration: item.ii_name_time,
    
    
    // Add icon information if found
    ...(iconData && {
      ddsFileName: iconData.ddsFileName,
      offset: iconData.offset,
      width: iconData.width,
      height: iconData.height,
      filesize: iconData.filesize,
      common: iconData.common
    })
  };
}

// Step 4: Merge and process all data
async function processGameData() {
  // Load all data
  const { itemsInfo, weaponsInfo } = await loadGameData();
  
  
  // Merge items and weapons into single array
  const allItems = [...itemsInfo, ...weaponsInfo];
  
  // Transform each item
  const processedItems = allItems.map(item => {
   
    // Transform and return
    return transformFieldNames(item, null);
  })
  
  return processedItems;
}

// Step 5: Save the processed data
async function saveProcessedData(data) {
  const outputFile = path.join(__dirname, '..','..', 'data', 'itemInfo.transformed.json');
  
  try {
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
  } catch (error) {
    logger.error('Error saving file:', error);
    throw error;
  }
}

// Step 6: Main execution function
async function run() {
  logger.info("Starting merging items and weapons...");

  try {
    
    const processedData = await processGameData();
    
    
    await saveProcessedData(processedData);
    logger.success(`Master list 'itemInfo.transformed.json' has been updated!`);
    process.exit(0);
    
  } catch (error) {
    console.error('Processing failed:', error);
    process.exit(1);
  }


}


module.exports = { run };
