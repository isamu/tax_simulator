
export const standard_monthly_fee = (value) => {
  if (value < 63000) {
    return 58000;
  }
  if (value >= 63000 && value < 73000) {
    return 68000;
  }
  if (value >= 73000 && value < 83000) {
    return 78000;
  }
  if (value >= 83000 && value < 93000) {
    return 88000;
  }
  if (value >= 93000 && value < 101000) {
    return 98000;
  }
  if (value >= 101000 && value < 107000) {
    return 104000;
  }
  if (value >= 107000 && value < 114000) {
    return 110000;
  }
  if (value >= 114000 && value < 122000) {
    return 118000;
  }
  if (value >= 122000 && value < 130000) {
    return 126000;
  }
  if (value >= 130000 && value < 138000) {
    return 134000;
  }
  if (value >= 138000 && value < 146000) {
    return 142000;
  }
  if (value >= 146000 && value < 155000) {
    return 150000;
  }
  if (value >= 155000 && value < 165000) {
    return 160000;
  }
  if (value >= 165000 && value < 175000) {
    return 170000;
  }
  if (value >= 175000 && value < 185000) {
    return 180000;
  }
  if (value >= 185000 && value < 195000) {
    return 190000;
  }
  if (value >= 195000 && value < 210000) {
    return 200000;
  }
  if (value >= 210000 && value < 230000) {
    return 220000;
  }
  if (value >= 230000 && value < 250000) {
    return 240000;
  }
  if (value >= 250000 && value < 270000) {
    return 260000;
  }
  if (value >= 270000 && value < 290000) {
    return 280000;
  }
  if (value >= 290000 && value < 310000) {
    return 300000;
  }
  if (value >= 310000 && value < 330000) {
    return 320000;
  }
  if (value >= 330000 && value < 350000) {
    return 340000;
  }
  if (value >= 350000 && value < 370000) {
    return 360000;
  }
  if (value >= 370000 && value < 395000) {
    return 380000;
  }
  if (value >= 395000 && value < 425000) {
    return 410000;
  }
  if (value >= 425000 && value < 455000) {
    return 440000;
  }
  if (value >= 455000 && value < 485000) {
    return 470000;
  }
  if (value >= 485000 && value < 515000) {
    return 500000;
  }
  if (value >= 515000 && value < 545000) {
    return 530000;
  }
  if (value >= 545000 && value < 575000) {
    return 560000;
  }
  if (value >= 575000 && value < 605000) {
    return 590000;
  }
  if (value >= 605000 && value < 635000) {
    return 620000;
  }
  if (value >= 635000 && value < 665000) {
    return 650000;
  }
  if (value >= 665000 && value < 695000) {
    return 680000;
  }
  if (value >= 695000 && value < 730000) {
    return 710000;
  }
  if (value >= 730000 && value < 770000) {
    return 750000;
  }
  if (value >= 770000 && value < 810000) {
    return 790000;
  }
  if (value >= 810000 && value < 855000) {
    return 830000;
  }
  if (value >= 855000 && value < 905000) {
    return 880000;
  }
  if (value >= 905000 && value < 955000) {
    return 930000;
  }
  if (value >= 955000 && value < 1005000) {
    return 980000;
  }
  if (value >= 1005000 && value < 1055000) {
    return 1030000;
  }
  if (value >= 1055000 && value < 1115000) {
    return 1090000;
  }
  if (value >= 1115000 && value < 1175000) {
    return 1150000;
  }
  if (value >= 1175000 && value < 1235000) {
    return 1210000;
  }
  if (value >= 1235000 && value < 1295000) {
    return 1270000;
  }
  if (value >= 1295000 && value < 1355000) {
    return 1330000;
  }
  if (value >= 1355000) {
    return 1390000;
  }
}

export const income_tax = (value) => {
  if (value <= 1950000) {
    return value * 0.05;
  }
  if (value > 1950000 && value <= 3300000) {
    return value * 0.1 - 97500;
  }
  if (value > 3300000 && value <= 6950000) {
    return value * 0.2 - 427500;
  }
  if (value > 6950000 && value <= 9000000) {
    return value * 0.23 - 636000;
  }
  if (value > 9000000 && value <= 18000000) {
    return value * 0.33 - 1536000;
  }
  if (value > 18000000 && value <= 40000000) {
    return value * 0.4 - 2796000;
  }
  if (value > 40000000) {
    return value * 0.45 - 4796000;
  }
  
}

export const income_deduction = (value) => {
  if (value < 650000) {
    return value;
  }
  if (value < 1800000) {
    return value * 0.4;
  }
  if (value < 3600000) {
    return value * 0.3 + 180000;
  }
  if (value < 6600000) {
    return value * 0.2 + 540000;
  }
  if (value < 10000000) {
    return value * 0.1 + 1200000;
  }
  return 2200000;
};

export const conv_jp_num = (value) => {

  let offset = Math.floor((String(value).length - 1) / 4);
  const unit = ['万', '億', '兆', '京',
                '垓', '秭', '穰', '溝',
                '澗', '正', '載', '極',
                '恒河沙', '阿僧祇', '那由他',
                '不可思議', '無量大数'];
  return String(value).replace( /(\d)(?=(\d\d\d\d)+(?!\d))/g, (str) => {
    offset = offset - 1;
    return str + unit[offset];
  });
};
