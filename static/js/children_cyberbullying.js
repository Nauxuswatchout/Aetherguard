document.addEventListener('DOMContentLoaded', () => {
  // 由于增强版JS会处理所有事件，我们在这里只做最小的初始化
  // 如果增强版JS加载失败，这个文件将作为备份
  if (!window.enhancedJSLoaded) {
    fetch('/random_records/cyberbullying')
      .then(res => res.json())
      .then(data => {
        const messagePool = document.getElementById('message-pool');
        data.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'draggable-message';
          div.textContent = item.text;
          div.draggable = true;
          div.dataset.label = item.label;
          div.dataset.id = index;
          div.addEventListener('dragstart', dragStart);
          messagePool.appendChild(div);
        });
      });
  
    const dropzones = document.querySelectorAll('.dropzone');
    dropzones.forEach(zone => {
      zone.addEventListener('dragover', dragOver);
      zone.addEventListener('drop', dropItem);
    });
  }
});
  
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.id);
}
  
function dragOver(e) {
  e.preventDefault();
}
  
function dropItem(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const draggedItem = document.querySelector(`.draggable-message[data-id='${id}']`);
  e.currentTarget.appendChild(draggedItem);
}
  
function checkAnswers() {
  let correct = 0;
  let total = 0;
  
  document.querySelectorAll('.dropzone').forEach(zone => {
    const expected = zone.dataset.label;
    zone.querySelectorAll('.draggable-message').forEach(msg => {
      total++;
      if (msg.dataset.label === expected) {
        correct++;
        msg.style.backgroundColor = '#d4edda'; // green
      } else {
        msg.style.backgroundColor = '#f8d7da'; // red
      }
    });
  });
  
  document.getElementById('result').textContent = `You got ${correct} out of ${total} correct! 🎉`;
}

// 设置标志表示增强版JS已经加载
window.enhancedJSLoaded = true;