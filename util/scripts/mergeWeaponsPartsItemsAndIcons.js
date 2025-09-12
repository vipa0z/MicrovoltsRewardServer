// Step 1: Read and parse your JSON files
const fs = require('fs').promises;
const path = require('path');

async function loadGameData() {
  try {
    // Define file paths
    const itemsFilePath = path.join(__dirname, '..','data', 'iteminfo.json');
    const iconsFilePath = path.join(__dirname, '..','data', 'iconsinfo.json');
    const weaponsFilePath = path.join(__dirname,'..', 'data', 'itemweaponsInfo.json');
    
    // Load all three files
    const itemsInfo = JSON.parse(await fs.readFile(itemsFilePath, 'utf8'));
    const weaponsInfo = JSON.parse(await fs.readFile(weaponsFilePath, 'utf8'));
    const iconsInfo = JSON.parse(await fs.readFile(iconsFilePath, 'utf8'));
    
    return { itemsInfo, weaponsInfo, iconsInfo };
  } catch (error) {
    console.error('Error loading files:', error);
    throw error;
  }
}

// Step 2: Create a lookup map for icons (for performance)
function createIconLookup(iconsInfo) {
  const iconMap = new Map();
  // 2141414 -> {ddsfile:'hair.dds','....etc}
  iconsInfo.forEach(icon => {
    iconMap.set(icon.ii_id, {
      ddsFileName: icon.ii_filename,
      offset: icon.ii_offset,
      width: icon.ii_width,
      height: icon.ii_height,
      filesize: icon.ii_filesize,
      common: icon.ii_common
    });
  });
  
  return iconMap;
}

// Step 3: Transform field names to human-friendly format
function transformFieldNames(item, iconData = null) {
  return {
    itemId: item.ii_id,
    itemName: item.ii_name,
    itemDuration: item.ii_name_time,
    iconId: item.ii_iconsmall,
    
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
  const { itemsInfo, weaponsInfo, iconsInfo } = await loadGameData();
  
  // Create icon lookup for fast searching
  const iconLookup = createIconLookup(iconsInfo);
  
  // Merge items and weapons into single array
  const allItems = [...itemsInfo, ...weaponsInfo];
  
  // Transform each item
  const processedItems = allItems.map(item => {
    // Look up icon data
    const iconData = iconLookup.get(item.ii_iconsmall);
    
    // Transform and return
    return transformFieldNames(item, iconData);
  }).filter(item => {
    // Optional: Filter out items without icons or other criteria
    return item.iconId !== null && item.iconId !== undefined;
  });
  
  return processedItems;
}

// Step 5: Save the processed data
async function saveProcessedData(data) {
  const outputFile = path.join(__dirname, 'processedGameData.json');
  
  try {
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
    console.log(`Successfully saved ${data.length} items to ${outputFile}`);
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

// Step 6: Main execution function
async function main() {
  try {
    console.log('Starting data processing...');
    
    const processedData = await processGameData();
    
    console.log(`Processed ${processedData.length} items`);
    
    // Optional: Log sample of processed data
    console.log('Sample processed item:', processedData[0]);
    
    await saveProcessedData(processedData);
    
    console.log('Data processing complete!');
  } catch (error) {
    console.error('Processing failed:', error);
  }
}

// Alternative approach using streams for large files
async function processLargeFiles() {
  const fs = require('fs');
  const { pipeline } = require('stream/promises');
  const { Transform } = require('stream');
  
  // Create transform stream for processing
  const processTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      // Process each chunk of data
      const processed = transformFieldNames(chunk);
      callback(null, processed);
    }
  });
  
  // Use for very large files
  // await pipeline(
  //   fs.createReadStream('input.json'),
  //   processTransform,
  //   fs.createWriteStream('output.json')
  // );
}

// Execute the main function
main();

