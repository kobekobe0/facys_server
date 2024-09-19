const identifierSort = (a, b) => {
    const getSortValue = (id) => {
      const match = id.match(/([A-Z]+)(\d*)/);
      const letterPart = match[1];
      const numberPart = match[2] ? parseInt(match[2], 10) : 0;
      return [numberPart, letterPart];
    };
  
    const [aNum, aLetter] = getSortValue(a);
    const [bNum, bLetter] = getSortValue(b);
  
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    return aLetter.localeCompare(bLetter);
}

// usage
// const sortedIdentifiers = IDENTIFIERS.sort(customSort);

export default identifierSort;