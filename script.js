import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    databaseURL: atob("aHR0cHM6Ly9wb3N0Y2FyZC1iNWRiYS1kZWZhdWx0LXJ0ZGIuYXNpYS1zb3V0aGVhc3QxLmZpcmViYXNlZGF0YWJhc2UuYXBwLw=="),
    projectId: atob("cG9zdGNhcmQtYjVkYmE=")
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const scene = document.getElementById('scene');
const cardWrapper = document.getElementById('card-wrapper');
const card = document.getElementById('postcard');
const flipBtn = document.getElementById('flip-btn');
const flipText = document.getElementById('flip-text');
const envBack = document.getElementById('env-back');
const envLeft = document.getElementById('env-left');
const envRight = document.getElementById('env-right');
const envBottom = document.getElementById('env-bottom');
const envFlap = document.getElementById('env-flap');
const envParts = [envBack, envLeft, envRight, envBottom, envFlap];
const envFrontSide = document.getElementById('env-front-side');
const envStamp = document.getElementById('env-stamp');
const stampDisplayImg = document.getElementById('stamp-display-img');
const envAddressDisplay = document.getElementById('env-address-display');
const displaySender = document.getElementById('display-sender');
const displayReceiver = document.getElementById('display-receiver');
const envSenderInput = document.getElementById('env-sender');
const envReceiverInput = document.getElementById('env-receiver');
const imageUpload = document.getElementById('image-upload');
const uploadTrigger = document.getElementById('upload-trigger');
const displayImage = document.getElementById('display-image');
const uploadHint = document.getElementById('upload-hint');
const messageText = document.getElementById('message-text');
const packBtn = document.getElementById('pack-btn');
const createNewBtn = document.getElementById('create-new-btn');
const mainControls = document.getElementById('main-controls');
const stampModal = document.getElementById('stamp-modal');
const stampOptions = document.querySelectorAll('.stamp-opt:not(#custom-stamp-btn)');
const customStampBtn = document.getElementById('custom-stamp-btn');
const stampUpload = document.getElementById('stamp-upload');
const confirmPackBtn = document.getElementById('confirm-pack-btn');
const finalLinkInput = document.getElementById('final-link-input');
const inlineQrBtn = document.getElementById('inline-qr-btn');
const inlineCopyBtn = document.getElementById('inline-copy-btn');
const qrModal = document.getElementById('qr-modal');
const qrCodeBox = document.getElementById('qr-code-box');
const downloadQrBtn = document.getElementById('download-qr-btn');
const closeQrBtn = document.getElementById('close-qr-btn');
let qrInstance = null;
const loadingScreen = document.getElementById('loading-screen');
const toastEl = document.getElementById('toast-message');
const videoModal = document.getElementById('video-modal');
const closeVideoModal = document.getElementById('close-video-modal');
const confirmVideoLink = document.getElementById('confirm-video-link');
const videoLinkInput = document.getElementById('video-link-input');
const btnImgUpload = document.getElementById('btn-img-upload');
const btnVideoEmbed = document.getElementById('btn-video-embed');
const displayIframe = document.getElementById('display-iframe');
const displayVideo = document.getElementById('display-video');
const musicModal = document.getElementById('music-modal');
const closeMusicModal = document.getElementById('close-music-modal');
const confirmMusicLink = document.getElementById('confirm-music-link');
const musicLinkInput = document.getElementById('music-link-input');
const btnAddMusic = document.getElementById('btn-add-music');
const displayMusic = document.getElementById('display-music');

let currentMediaType = 'none';
let currentMediaUrl = '';
let currentMusicUrl = '';
let currentMusicType = '';
let currentBase64 = "";
let currentStampBase64 = stampOptions[0].getAttribute('data-src');
let isFlipped = false;
let isViewingMode = false;
let isPortrait = false;

const orientationBtn = document.getElementById('orientation-btn');
const orientationText = document.getElementById('orientation-text');

function showToast(message) {
    toastEl.innerText = message; toastEl.classList.add('show');
    setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

function toggleFlip() {
    isFlipped = !isFlipped;
    card.classList.toggle('is-flipped');
    flipText.textContent = isFlipped ? 'Lật sang mặt trước' : 'Lật sang mặt sau';
}

function formatPostmarkDate(timestamp) {
    const d = new Date(timestamp);
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return { date: `${day} ${month} ${year}`, time: `${hours}:${minutes}` };
}

function applyPostmark(timestamp) {
    const pmData = formatPostmarkDate(timestamp);
    document.getElementById('card-pm-date').textContent = pmData.date;
    document.getElementById('card-pm-time').textContent = pmData.time;
    document.getElementById('env-pm-date').textContent = pmData.date;
    document.getElementById('env-pm-time').textContent = pmData.time;
    document.getElementById('card-postmark').style.display = 'block';
    document.getElementById('env-postmark').style.display = 'block';
}

flipBtn.addEventListener('click', toggleFlip);

orientationBtn.addEventListener('click', () => {
    isPortrait = !isPortrait;
    if (isPortrait) {
        scene.classList.add('portrait');
        orientationText.textContent = 'Xoay Ngang';
    } else {
        scene.classList.remove('portrait');
        orientationText.textContent = 'Xoay Dọc';
    }
});

let panX = 50, panY = 50, isDraggingImage = false;
let dragStartX, dragStartY, initialPanX, initialPanY, maxMoveX, maxMoveY, wasDragging = false;

function initDrag(e) {
    if (isViewingMode || (currentMediaType !== 'image' && currentMediaType !== 'none') || (!currentBase64 && !currentMediaUrl)) return;
    const dragHint = document.getElementById('drag-hint');
    if (dragHint) dragHint.classList.remove('show');
    const pos = e.touches ? e.touches[0] : e;
    dragStartX = pos.clientX; dragStartY = pos.clientY;
    initialPanX = panX; initialPanY = panY;
    isDraggingImage = true; wasDragging = false;
    const rect = displayImage.getBoundingClientRect();
    const containerAR = rect.width / rect.height;
    const imageAR = displayImage.naturalWidth / displayImage.naturalHeight;
    maxMoveX = 0; maxMoveY = 0;
    if (imageAR > containerAR) { maxMoveX = rect.height * imageAR - rect.width; }
    else { maxMoveY = rect.width / imageAR - rect.height; }
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchend', onDragEnd);
    if (!e.touches) e.preventDefault();
}

function onDragMove(e) {
    if (!isDraggingImage) return;
    const pos = e.touches ? e.touches[0] : e;
    const dx = pos.clientX - dragStartX, dy = pos.clientY - dragStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) wasDragging = true;
    if (maxMoveX > 0) { panX = Math.max(0, Math.min(100, initialPanX - (dx / maxMoveX) * 100)); }
    if (maxMoveY > 0) { panY = Math.max(0, Math.min(100, initialPanY - (dy / maxMoveY) * 100)); }
    displayImage.style.objectPosition = `${panX}% ${panY}%`;
    if (wasDragging && e.cancelable) e.preventDefault();
}

function onDragEnd() {
    isDraggingImage = false;
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchend', onDragEnd);
    setTimeout(() => { wasDragging = false; }, 50);
}

displayImage.addEventListener('mousedown', initDrag);
displayImage.addEventListener('touchstart', initDrag, { passive: false });

uploadTrigger.addEventListener('click', (e) => {
    const isReceiver = !!new URLSearchParams(window.location.search).get('id');
    if (wasDragging) { e.preventDefault(); e.stopPropagation(); return; }
    if (!isReceiver) e.stopPropagation();
});

if (btnImgUpload) btnImgUpload.addEventListener('click', () => imageUpload.click());
if (btnVideoEmbed) btnVideoEmbed.addEventListener('click', () => videoModal.classList.add('active'));
if (closeVideoModal) closeVideoModal.addEventListener('click', () => videoModal.classList.remove('active'));

function hideAllMedia() {
    displayImage.style.display = 'none';
    displayIframe.style.display = 'none';
    displayVideo.style.display = 'none';
    uploadHint.style.display = 'none';
    btnAddMusic.style.display = 'none';
    currentMusicUrl = ''; currentMusicType = '';
    const extMusic = document.getElementById('external-music-container');
    if (extMusic) { extMusic.classList.remove('visible'); setTimeout(() => extMusic.style.display = 'none', 500); }
    const dragHint = document.getElementById('drag-hint');
    if (dragHint) dragHint.classList.remove('show');
    displayIframe.src = ''; displayVideo.src = ''; displayMusic.src = '';
}

if (confirmVideoLink) confirmVideoLink.addEventListener('click', () => {
    let url = videoLinkInput.value.trim();
    if (!url) { showToast('Vui lòng dán đường link vào ô trống!'); return; }
    hideAllMedia(); currentMediaType = 'video';
    if (url.includes('streamable.com')) {
        currentMediaType = 'streamable';
        let id = url.split('/').pop();
        if (url.includes('/e/')) id = url.split('/e/')[1].split('?')[0];
        currentMediaUrl = `https://streamable.com/e/${id}`;
        displayIframe.src = currentMediaUrl; displayIframe.style.display = 'block';
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        currentMediaType = 'youtube';
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
        currentMediaUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
        displayIframe.src = currentMediaUrl; displayIframe.style.display = 'block';
    } else {
        currentMediaType = 'mp4'; currentMediaUrl = url;
        displayVideo.src = currentMediaUrl; displayVideo.style.display = 'block';
    }
    videoModal.classList.remove('active');
});

if (btnAddMusic) btnAddMusic.addEventListener('click', (e) => { e.stopPropagation(); musicModal.classList.add('active'); });
if (closeMusicModal) closeMusicModal.addEventListener('click', () => musicModal.classList.remove('active'));

if (confirmMusicLink) confirmMusicLink.addEventListener('click', () => {
    let url = musicLinkInput.value.trim();
    if (!url) { showToast('Vui lòng dán đường link vào ô trống!'); return; }
    let isMobile = window.innerWidth <= 500;
    if (url.includes('spotify.com')) {
        currentMusicType = 'spotify';
        let trackId = url.split('track/')[1];
        if (trackId) trackId = trackId.split('?')[0];
        currentMusicUrl = `https://open.spotify.com/embed/track/${trackId}`;
    } else if (url.includes('soundcloud.com')) {
        currentMusicType = 'soundcloud';
        let visualParam = isMobile ? 'false' : 'true';
        currentMusicUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&visual=${visualParam}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
    } else { showToast('Link nhạc chưa được hỗ trợ. Hãy dùng Spotify hoặc SoundCloud nhé!'); return; }
    displayMusic.src = currentMusicUrl;
    const extMusic = document.getElementById('external-music-container');
    if (extMusic) {
        extMusic.style.height = currentMusicType === 'spotify' ? (isMobile ? '80px' : '352px') : (isMobile ? '80px' : '300px');
        extMusic.style.display = 'block';
        setTimeout(() => extMusic.classList.add('visible'), 50);
    }
    musicModal.classList.remove('active');
});

imageUpload.addEventListener('click', (e) => e.stopPropagation());
imageUpload.addEventListener('change', function(e) {
    handleImageCompression(e.target.files[0], (base64) => {
        hideAllMedia(); currentMediaType = 'image'; currentBase64 = base64;
        currentMediaUrl = base64; displayImage.src = base64; displayImage.style.display = 'block';
        btnAddMusic.style.display = 'block';
        panX = 50; panY = 50; displayImage.style.objectPosition = '50% 50%';
        const dragHint = document.getElementById('drag-hint');
        if (dragHint) { dragHint.classList.add('show'); setTimeout(() => dragHint.classList.remove('show'), 4000); }
    });
});

function handleImageCompression(file, callback, customMaxSize = 800) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width, height = img.height, maxSize = customMaxSize;
            if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; }
            else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            canvas.width = width; canvas.height = height;
            canvas.getContext('2d').drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

packBtn.addEventListener('click', () => {
    if (!currentMediaUrl && !currentBase64 && !messageText.value.trim()) {
        showToast("Hãy tải ảnh/video lên hoặc viết vài lời trước khi đóng gói nhé!"); return;
    }
    if (isFlipped) toggleFlip();
    mainControls.style.display = 'none';
    document.getElementById('main-subtitle').innerText = "Đang đưa bưu thiếp vào phong bì...";
    envParts.forEach(el => { el.style.display = 'block'; });
    envFlap.style.transform = 'rotateX(180deg)';
    setTimeout(() => {
        cardWrapper.style.transform = 'translateY(-110%) scale(0.85)';
        setTimeout(() => {
            cardWrapper.style.zIndex = '10';
            cardWrapper.style.transform = 'translateY(0) scale(0.85)';
            setTimeout(() => {
                envFlap.style.transform = 'rotateX(0deg)';
                setTimeout(() => {
                    document.getElementById('main-subtitle').innerText = "Xoay ra mặt trước để dán tem...";
                    scene.style.transform = 'scaleX(0)';
                    scene.style.transition = 'transform 0.4s ease-in-out';
                    setTimeout(() => {
                        envParts.forEach(el => { el.style.display = 'none'; });
                        envFrontSide.style.display = 'block';
                        envAddressDisplay.style.opacity = '0';
                        envStamp.style.opacity = '0';
                        envStamp.classList.remove('stamped');
                        scene.style.transform = 'scaleX(1)';
                        setTimeout(() => { stampModal.classList.add('active'); }, 500);
                    }, 400);
                }, 800);
            }, 600);
        }, 600);
    }, 300);
});

stampOptions.forEach(opt => {
    if (opt.hasAttribute('data-src')) {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.stamp-opt').forEach(el => el.classList.remove('selected'));
            opt.classList.add('selected');
            currentStampBase64 = opt.getAttribute('data-src');
        });
    }
});

function initFileStamps() {
    const fileStamps = [
        { id: 'stamp-ka', file: './ka.png' },
        { id: 'stamp-final', file: './final.png' },
        { id: 'stamp-xanh', file: './xanh.png' }
    ];
    for (const { id, file } of fileStamps) {
        const el = document.getElementById(id);
        if (!el) continue;
        el.setAttribute('data-src', file);
        el.addEventListener('click', () => {
            document.querySelectorAll('.stamp-opt').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            currentStampBase64 = file;
        });
    }
}
initFileStamps();

customStampBtn.addEventListener('click', () => stampUpload.click());
stampUpload.addEventListener('change', function(e) {
    handleImageCompression(e.target.files[0], (base64) => {
        currentStampBase64 = base64;
        customStampBtn.innerHTML = `<img src="${base64}">`;
        document.querySelectorAll('.stamp-opt').forEach(el => el.classList.remove('selected'));
        customStampBtn.classList.add('selected');
        customStampBtn.style.padding = '0';
    }, 150);
});

confirmPackBtn.addEventListener('click', async () => {
    stampModal.classList.remove('active');
    const sendTimestamp = Date.now();
    window.postcardSendTimestamp = sendTimestamp;
    applyPostmark(sendTimestamp);
    stampDisplayImg.src = currentStampBase64;
    const senderName = envSenderInput.value.trim() || 'Một người giấu tên';
    const receiverName = envReceiverInput.value.trim() || 'Người bạn phương xa';
    displaySender.textContent = senderName;
    displayReceiver.textContent = receiverName;
    envAddressDisplay.style.opacity = '1';
    envAddressDisplay.style.transition = 'opacity 0.5s';
    document.getElementById('main-subtitle').innerText = "Đang đóng gói yêu thương...";
    setTimeout(() => {
        envStamp.style.opacity = '1';
        envStamp.classList.add('stamped');
        setTimeout(saveToFirebaseAndShowLink, 1000);
    }, 500);
});

async function saveToFirebaseAndShowLink() {
    loadingScreen.style.display = 'flex';
    document.getElementById('loading-text').textContent = "Đang lưu lên hệ thống...";
    try {
        const postcardsRef = ref(db, 'postcards');
        const newPostcardRef = push(postcardsRef);
        await set(newPostcardRef, {
            image: currentMediaType === 'image' ? currentBase64 : '',
            mediaUrl: currentMediaUrl, mediaType: currentMediaType,
            musicUrl: currentMusicUrl, musicType: currentMusicType,
            text: messageText.value, stamp: currentStampBase64,
            sender: displaySender.textContent, receiver: displayReceiver.textContent,
            isPortrait: isPortrait, panX: panX, panY: panY,
            createdAt: window.postcardSendTimestamp || Date.now()
        });
        const baseUrl = window.location.href.split('?')[0];
        let finalUrl = baseUrl + "?id=" + newPostcardRef.key;
        try {
            const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(finalUrl)}`);
            if (response.ok) { const data = await response.json(); if (data.shorturl) finalUrl = data.shorturl; }
        } catch(e) { console.log("Không rút gọn được, dùng link gốc"); }
        finalLinkInput.value = finalUrl;
        window.generatedPostcardLink = finalUrl;
        qrCodeBox.innerHTML = ''; qrInstance = null;
        mainControls.style.display = 'flex';
        flipBtn.style.display = 'none'; packBtn.style.display = 'none';
        createNewBtn.style.display = 'flex'; inlineCopyBtn.style.display = 'flex'; inlineQrBtn.style.display = 'flex';
        document.getElementById('main-subtitle').innerHTML = "Đã gửi thành công!<br>Hãy copy link hoặc tạo mã QR gửi cho người nhận nhé.";
    } catch(error) {
        console.error("Lỗi lưu:", error);
        showToast("Lỗi kết nối. Vui lòng thử lại!");
    } finally {
        loadingScreen.style.display = 'none';
    }
}

inlineCopyBtn.addEventListener('click', (e) => {
    finalLinkInput.select(); document.execCommand('copy');
    const orig = e.currentTarget.innerHTML;
    e.currentTarget.innerHTML = `<svg style="width:20px;height:20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Đã Copy!`;
    setTimeout(() => { e.currentTarget.innerHTML = orig; }, 2000);
});

// Nut gradient: TOGGLE THEME tim khi bam
let isPurpleTheme = true;
const changeColorBtn = document.getElementById('changeColorBtn');
if (changeColorBtn) {
    changeColorBtn.addEventListener('click', () => {
        isPurpleTheme = !isPurpleTheme;
        document.body.classList.toggle('theme-purple', isPurpleTheme);
    });
}

inlineQrBtn.addEventListener('click', () => {
    // Neu da co link thi dong thoi mo QR
    const url = finalLinkInput.value;
    if (url) {
        qrCodeBox.innerHTML = '';
        qrInstance = new QRCode(qrCodeBox, {
            text: url, width: 220, height: 220,
            colorDark: isPurpleTheme ? '#3b2f6e' : '#1e3a8a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        qrModal.classList.add('active');
    }
});

closeQrBtn.addEventListener('click', () => qrModal.classList.remove('active'));
qrModal.addEventListener('click', (e) => { if (e.target === qrModal) qrModal.classList.remove('active'); });

downloadQrBtn.addEventListener('click', () => {
    const img = qrCodeBox.querySelector('img');
    const canvas = qrCodeBox.querySelector('canvas');
    const link = document.createElement('a');
    link.download = 'postcard-qr.png';
    if (canvas) link.href = canvas.toDataURL('image/png');
    else if (img) link.href = img.src;
    else { showToast('Chưa tạo QR!'); return; }
    link.click();
});

window.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cardId = urlParams.get('id');
    if (cardId) {
        isViewingMode = true;
        document.getElementById('main-subtitle').innerHTML = "Bạn có 1 bưu thiếp mới.<br><b>Chạm vào phong bì để bóc thư nhé!</b>";
        scene.style.opacity = '0';
        packBtn.style.display = 'none'; flipBtn.style.display = 'none'; orientationBtn.style.display = 'none';
        uploadHint.style.display = 'none'; messageText.readOnly = true;
        loadingScreen.style.display = 'flex';
        document.getElementById('loading-text').textContent = "Đang nhận thư...";
        try {
            const snapshot = await get(child(ref(db), `postcards/${cardId}`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.mediaUrl || data.image) {
                    displayImage.style.display = 'none'; displayIframe.style.display = 'none';
                    displayVideo.style.display = 'none'; uploadHint.style.display = 'none';
                    let loadType = data.mediaType || 'image', loadUrl = data.mediaUrl || data.image;
                    if (loadType === 'image') {
                        displayImage.src = loadUrl; displayImage.style.display = 'block';
                        if (data.panX !== undefined && data.panY !== undefined)
                            displayImage.style.objectPosition = `${data.panX}% ${data.panY}%`;
                    } else if (loadType === 'streamable' || loadType === 'youtube') {
                        displayIframe.src = loadUrl; displayIframe.style.display = 'block';
                    } else if (loadType === 'mp4' || loadType === 'video') {
                        displayVideo.src = loadUrl; displayVideo.style.display = 'block';
                    }
                    if (data.musicUrl) {
                        let finalMusicUrl = data.musicUrl;
                        if (window.innerWidth <= 500 && finalMusicUrl.includes('soundcloud.com'))
                            finalMusicUrl = finalMusicUrl.replace('visual=true', 'visual=false');
                        displayMusic.src = finalMusicUrl; btnAddMusic.style.display = 'none';
                    }
                }
                if (data.text) messageText.value = data.text;
                stampDisplayImg.src = data.stamp || stampOptions[0].getAttribute('data-src');
                if (data.sender || data.receiver) {
                    displaySender.textContent = data.sender || 'Một người giấu tên';
                    displayReceiver.textContent = data.receiver || 'Người bạn phương xa';
                    envAddressDisplay.style.display = 'block';
                }
                if (data.isPortrait) { isPortrait = true; scene.classList.add('portrait'); orientationText.textContent = 'Xoay Ngang'; }
                if (data.createdAt) applyPostmark(data.createdAt);
                envFrontSide.style.display = 'block';
                envAddressDisplay.style.opacity = '1';
                envStamp.style.opacity = '1'; envStamp.classList.add('stamped');
                envParts.forEach(el => { el.style.display = 'none'; });
                cardWrapper.style.zIndex = '10'; cardWrapper.style.transform = 'translateY(0) scale(0.85)';
                scene.style.cursor = "pointer";
                scene.addEventListener('click', openEnvelopeFromReceiver);
            } else { showToast("Bưu thiếp không tồn tại!"); }
        } catch(error) { showToast("Lỗi tải bưu thiếp."); }
        finally {
            loadingScreen.style.display = 'none';
            scene.style.transition = 'opacity 0.5s ease-in-out'; scene.style.opacity = '1';
        }
    }
});

function openEnvelopeFromReceiver() {
    if (!isViewingMode) return;
    isViewingMode = false; scene.style.cursor = "default";
    scene.removeEventListener('click', openEnvelopeFromReceiver);
    document.getElementById('main-subtitle').innerText = "Đang bóc thư...";
    scene.style.transform = 'scaleX(0)'; scene.style.transition = 'transform 0.4s ease-in-out';
    setTimeout(() => {
        envFrontSide.style.display = 'none';
        envParts.forEach(el => { el.style.display = 'block'; });
        envFlap.style.transform = 'rotateX(0deg)';
        scene.style.transform = 'scaleX(1)';
        setTimeout(() => {
            envFlap.style.transform = 'rotateX(180deg)';
            setTimeout(() => {
                cardWrapper.style.transform = 'translateY(-110%) scale(0.85)';
                setTimeout(() => {
                    envParts.forEach(el => el.style.opacity = '0');
                    cardWrapper.style.zIndex = '30'; cardWrapper.style.transform = 'translateY(0) scale(1)';
                    setTimeout(() => {
                        envParts.forEach(el => el.style.display = 'none');
                        envParts.forEach(el => el.style.opacity = '1');
                        createNewBtn.style.display = 'flex'; flipBtn.style.display = 'flex';
                        document.getElementById('main-subtitle').innerText = "Chạm vào nút bên dưới để lật mặt sau nhé!";
                        const extMusic = document.getElementById('external-music-container');
                        if (extMusic && displayMusic.getAttribute('src')) {
                            let isMobile = window.innerWidth <= 500;
                            extMusic.style.height = displayMusic.src.includes('spotify.com') ? (isMobile ? '80px' : '352px') : (isMobile ? '80px' : '300px');
                            extMusic.style.display = 'block';
                            setTimeout(() => extMusic.classList.add('visible'), 50);
                        }
                    }, 800);
                }, 600);
            }, 600);
        }, 500);
    }, 400);
}