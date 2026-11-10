const fs = require('fs');
const q = JSON.parse(fs.readFileSync('GIVEN_DATA/questions.json', 'utf8'));

const refs = [];
let imgTagCount = 0;
const imgTagsFound = [];

q.forEach(item => {
  const p = item[item.questionType] || {};
  const qi = p.quesImages || [];
  const si = p.solutionImages || [];
  
  const qHtml = p.question || '';
  const sHtml = p.solution || '';
  const combined = qHtml + ' ' + sHtml;

  const matches = combined.match(/<img[^>]+>/gi) || [];
  if (matches.length > 0) {
    imgTagCount += matches.length;
    imgTagsFound.push({ qid: item._id, matches });
  }

  if (qi.length > 0 || si.length > 0) {
    refs.push({ qid: item._id, quesImages: qi, solutionImages: si });
  }
});

console.log('Count with non-empty quesImages or solutionImages:', refs.length);
if (refs.length > 0) console.log(JSON.stringify(refs, null, 2));

console.log('Total <img> tags in HTML:', imgTagCount);
if (imgTagsFound.length > 0) console.log(JSON.stringify(imgTagsFound, null, 2));

