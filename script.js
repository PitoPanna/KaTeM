import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase konfiguráció
const firebaseConfig = {
  apiKey: "AIzaSyCB17ko7nMtzUA5u-_LTM8trpfOF6LDM_Y",
  authDomain: "katem-b306c.firebaseapp.com",
  projectId: "katem-b306c",
  storageBucket: "katem-b306c.firebasestorage.app",
  messagingSenderId: "31383462473",
  appId: "1:31383462473:web:c6c4c3cb6c522e36711598",
  measurementId: "G-CK6HEQKTER"
};

// Firebase inicializálása
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', function() {

    let isCurrentEditor = false;

    // === LIGHTBOX (KÉPNAGYÍTÓ) KEZELÉSE ===
    const lightboxModal = document.getElementById('imageLightboxModal');
    const lightboxImg = document.getElementById('lightboxImage');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.querySelector('.lightbox-close');

    function openLightbox(url, caption) {
        if (!lightboxModal || !lightboxImg) return;
        lightboxImg.src = url;
        if (lightboxCaption) lightboxCaption.textContent = caption || '';
        lightboxModal.style.display = 'flex';
    }

    function closeLightbox() {
        if (!lightboxModal || !lightboxImg) return;
        lightboxModal.style.display = 'none';
        lightboxImg.src = '';
        if (lightboxCaption) lightboxCaption.textContent = '';
    }

    if (lightboxClose) lightboxClose.onclick = closeLightbox;
    if (lightboxModal) {
        lightboxModal.onclick = (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-content-wrapper')) {
                closeLightbox();
            }
        };
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxModal && lightboxModal.style.display === 'flex') {
            closeLightbox();
        }
    });

    // === 1. NAVIGÁCIÓ KEZELÉSE ===
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            if (!targetId) return;

            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                navButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                targetContent.classList.add('active');
            }
        });
    });

    // === 2. AUTH MODAL KEZELÉSE ===
    const authModal = document.getElementById('authModal');
    const openAuthBtn = document.getElementById('openAuthModalBtn');
    const closeModalBtn = document.querySelector('.close-modal');

    if (openAuthBtn && authModal) openAuthBtn.onclick = () => authModal.style.display = 'block';
    if (closeModalBtn && authModal) closeModalBtn.onclick = () => authModal.style.display = 'none';

    const loginTabBtn = document.getElementById('loginTabBtn');
    const registerTabBtn = document.getElementById('registerTabBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginTabBtn && registerTabBtn) {
        loginTabBtn.onclick = () => {
            loginTabBtn.classList.add('active');
            registerTabBtn.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        };

        registerTabBtn.onclick = () => {
            registerTabBtn.classList.add('active');
            loginTabBtn.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        };
    }

    // === 3. REGISZTRÁCIÓ ===
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, "profiles", user.uid), {
                    email: email,
                    is_approved: false
                });

                alert('Sikeres regisztráció! A fiókod jóváhagyásra vár a szervezőknél.');
                registerForm.reset();
                if (authModal) authModal.style.display = 'none';
            } catch (error) {
                alert('Hiba a regisztráció során: ' + error.message);
            }
        });
    }

    // === BEJELENTKEZÉSI ÁLLAPOT ÉS JOGOSULTSÁG FIGYELÉSE ===
    onAuthStateChanged(auth, async (user) => {
        const adminBtn = document.getElementById('adminNavBtn');
        const openAuthBtn = document.getElementById('openAuthModalBtn');

        if (user) {
            try {
                const profileRef = doc(db, "profiles", user.uid);
                const profileDoc = await getDoc(profileRef);

                if (profileDoc.exists() && profileDoc.data().is_approved) {
                    isCurrentEditor = true;
                    if (adminBtn) adminBtn.style.display = 'inline-block';
                    if (openAuthBtn) {
                        const shortEmail = user.email ? user.email.split('@')[0] : 'Szervező';
                        openAuthBtn.textContent = `🚪 Kijelentkezés (${shortEmail})`;
                        openAuthBtn.onclick = async () => {
                            if (confirm('Biztosan ki szeretnél jelentkezni?')) {
                                await signOut(auth);
                                alert('Sikeresen kijelentkeztél!');
                            }
                        };
                    }
                    loadPendingUsers();
                } else {
                    isCurrentEditor = false;
                    if (adminBtn) adminBtn.style.display = 'none';
                    if (openAuthBtn) {
                        openAuthBtn.textContent = '🔑 Szervezői belépés';
                        openAuthBtn.onclick = () => { if (authModal) authModal.style.display = 'block'; };
                    }
                }
            } catch (err) {
                console.error("Profil lekérési hiba:", err);
                isCurrentEditor = false;
            }
        } else {
            isCurrentEditor = false;
            if (adminBtn) adminBtn.style.display = 'none';
            if (openAuthBtn) {
                openAuthBtn.textContent = '🔑 Szervezői belépés';
                openAuthBtn.onclick = () => { if (authModal) authModal.style.display = 'block'; };
            }
        }

        // Galéria újratöltése a friss jogosultságok alapján
        loadGallery();
    });

    // === 4. BEJELENTKEZÉS ===
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                // 1. Firebase Auth Bejelentkezés
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Profil lekérése Firestore-ból
                const profileRef = doc(db, "profiles", user.uid);
                const profileDoc = await getDoc(profileRef);

                if (profileDoc.exists() && profileDoc.data().is_approved) {
                    alert('Sikeres bejelentkezés!');
                    if (authModal) authModal.style.display = 'none';
                    loginForm.reset();
                } else {
                    alert('A fiókod még jóváhagyásra vár a szervezőknél!');
                    await signOut(auth);
                }
            } catch (error) {
                console.error("Bejelentkezési hiba részletei:", error);
                
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    alert('Hibás jelszót adtál meg!');
                } else if (error.code === 'auth/user-not-found') {
                    alert('Ilyen e-mail címmel nem található fiók!');
                } else if (error.code === 'auth/configuration-not-found') {
                    alert('A Firebase-ben még nincs engedélyezve az Email/Password belépés!');
                } else {
                    alert('Hiba a bejelentkezéskor: ' + error.message);
                }
            }
        });
    }

    // === 5. JÓVÁHAGYÁSRA VÁRÓ SZERVEZŐK (ADMIN) ===
    async function loadPendingUsers() {
        try {
            const q = query(collection(db, "profiles"), where("is_approved", "==", false));
            const querySnapshot = await getDocs(q);
            const container = document.getElementById('pendingUsersList');
            if (!container) return;

            container.innerHTML = '';
            if (querySnapshot.empty) {
                container.innerHTML = '<p>Nincs jóváhagyásra váró regisztráció.</p>';
                return;
            }

            querySnapshot.forEach((userDoc) => {
                const data = userDoc.data();
                const div = document.createElement('div');
                div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; padding:0.5rem; background:#f1f5f9; border-radius:4px;';
                div.innerHTML = `<span>${data.email}</span>
                    <button class="btn approve-btn" data-uid="${userDoc.id}" style="padding:0.3rem 0.8rem; font-size:0.85rem;">Jóváhagyás</button>`;
                container.appendChild(div);
            });

            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.onclick = async () => {
                    const uid = btn.getAttribute('data-uid');
                    await updateDoc(doc(db, "profiles", uid), { is_approved: true });
                    alert('Szervező sikeresen jóváhagyva!');
                    loadPendingUsers();
                };
            });
        } catch (error) {
            console.error("Jóváhagyási lista hiba:", error);
        }
    }

    // === 6. ESEMÉNYEK BETÖLTÉSE ÉS FELTÖLTÉSE (PONTOSAN LEKEZELVE) ===
    async function loadEvents() {
        try {
            const q = query(collection(db, "events"), orderBy("event_date", "asc"));
            const querySnapshot = await getDocs(q);

            const homeList = document.getElementById('homeEventsList');
            const upcomingList = document.getElementById('allUpcomingEvents');
            const pastList = document.getElementById('allPastEvents');

            if (homeList) homeList.innerHTML = '';
            if (upcomingList) upcomingList.innerHTML = '';
            if (pastList) pastList.innerHTML = '';

            const now = new Date();
            let upcomingCount = 0;

            querySnapshot.forEach((eventDoc) => {
                const event = eventDoc.data();
                const eventDate = new Date(event.event_date);
                const dateStr = eventDate.toLocaleString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                if (eventDate >= now) {
                    const upcomingCardHTML = `<div class="event-card">
                        <div class="event-date">📅 ${dateStr}</div>
                        <h4>${event.title}</h4>
                        <p class="event-desc">${event.description || ''}</p>
                    </div>`;

                    if (upcomingList) upcomingList.innerHTML += upcomingCardHTML;
                    if (homeList) {
                        homeList.innerHTML += upcomingCardHTML;
                        upcomingCount++;
                    }
                } else {
                    const pastCardHTML = `<div class="event-card past-event-card" style="opacity: 0.75; background: #f8fafc;">
                        <div class="event-date" style="color: #ef4444; font-weight: bold;">⌛ LEJÁRT - ${dateStr}</div>
                        <h4 style="text-decoration: line-through; color: #64748b;">${event.title}</h4>
                        <p class="event-desc">${event.description || ''}</p>
                    </div>`;

                    if (pastList) pastList.innerHTML += pastCardHTML;
                }
            });

            if (homeList && upcomingCount === 0) homeList.innerHTML = '<p>Jelenleg nincs kiírt közelgő esemény.</p>';
            if (upcomingList && upcomingList.innerHTML === '') upcomingList.innerHTML = '<p>Nincs közelgő esemény.</p>';
            if (pastList && pastList.innerHTML === '') pastList.innerHTML = '<p>Nincs múltbéli esemény.</p>';
        } catch (error) {
            console.log("Események betöltési hiba:", error);
        }
    }

    // Új esemény mentése gomb lekezelése
    const newEventForm = document.getElementById('newEventForm');
    if (newEventForm) {
        newEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('eventTitle').value;
            const event_date = document.getElementById('eventDate').value;
            const description = document.getElementById('eventDescription').value;

            try {
                await addDoc(collection(db, "events"), {
                    title: title,
                    event_date: event_date,
                    description: description
                });
                alert('Esemény sikeresen hozzáadva!');
                newEventForm.reset();
                loadEvents();
            } catch (error) {
                alert('Hiba az esemény mentésekor: ' + error.message);
            }
        });
    }
    // === 7. GALÉRIA BETÖLTÉSE (EGYFORMA KÉPEK, NAGYÍTÁS ÉS BIZTONSÁGOS TÖRLÉS) ===
    async function loadGallery() {
        try {
            const q = query(collection(db, "gallery"), orderBy("created_at", "asc"));
            const querySnapshot = await getDocs(q);
            const galleryGrid = document.getElementById('galleryGrid');
            if (!galleryGrid) return;

            galleryGrid.innerHTML = '';
            if (querySnapshot.empty) {
                galleryGrid.innerHTML = '<p>Még nincsenek feltöltött képek a galériában.</p>';
                return;
            }

            querySnapshot.forEach((imgDoc) => {
                const img = imgDoc.data();
                const docId = imgDoc.id;

                const cardDiv = document.createElement('div');
                cardDiv.className = 'gallery-item-card';

                // Törlés gomb CSAK jóváhagyott szerkesztőknek
                let deleteBtnHTML = '';
                if (isCurrentEditor) {
                    deleteBtnHTML = `<button class="delete-img-btn" data-id="${docId}" title="Kép törlése">🗑️ Törlés</button>`;
                }

                let captionOverlayHTML = '';
                if (img.caption && img.caption.trim()) {
                    captionOverlayHTML = `<div class="gallery-caption-overlay">${img.caption}</div>`;
                }

                cardDiv.innerHTML = `
                    <img src="${img.image_url}" alt="${img.caption || 'Galéria kép'}" class="gallery-thumb" loading="lazy">
                    ${captionOverlayHTML}
                    ${deleteBtnHTML}
                `;

                // Kattintásra a kép megnyitása nagy méretben
                cardDiv.onclick = (e) => {
                    if (e.target.closest('.delete-img-btn')) return;
                    openLightbox(img.image_url, img.caption);
                };

                // Törlés gomb eseménykezelő
                const deleteBtn = cardDiv.querySelector('.delete-img-btn');
                if (deleteBtn) {
                    deleteBtn.onclick = async (e) => {
                        e.stopPropagation(); // Ne nyissa meg a képet nagyban

                        if (!isCurrentEditor) {
                            alert('Csak szerkesztői jogosultsággal törölhetsz képet!');
                            return;
                        }

                        if (confirm('Biztosan törölni szeretnéd ezt a képet a galériából?')) {
                            try {
                                await deleteDoc(doc(db, "gallery", docId));
                                alert('Kép sikeresen törölve!');
                                loadGallery();
                            } catch (err) {
                                alert('Hiba a törlés során: ' + err.message);
                            }
                        }
                    };
                }

                galleryGrid.appendChild(cardDiv);
            });

        } catch (error) {
            console.log("Galéria betöltési hiba:", error);
        }
    }

    // Segédfunkció: Kép automatikus átméretezése és tömörítése
    function compressImage(file, maxWidth = 1000, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    const newImageForm = document.getElementById('newImageForm');
    if (newImageForm) {
        newImageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('imageFile');
            const caption = document.getElementById('imageCaption').value;

            if (!fileInput || fileInput.files.length === 0) {
                alert('Kérlek válassz ki egy képet!');
                return;
            }

            const file = fileInput.files[0];

            try {
                const compressedImageBase64 = await compressImage(file, 1000, 0.6);

                await addDoc(collection(db, "gallery"), {
                    image_url: compressedImageBase64,
                    caption: caption,
                    created_at: new Date().toISOString()
                });

                alert('Kép sikeresen feltöltve!');
                newImageForm.reset();
                loadGallery();
            } catch (error) {
                alert('Hiba a kép mentésekor: ' + error.message);
            }
        });
    } 
    // === 8. HIBABEJELEnTŐ ŰRLAP LEKEZELÉSE ===
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reporterEmail').value;
            const type = document.getElementById('issueType').value;
            const description = document.getElementById('issueDescription').value;

            try {
                await addDoc(collection(db, "issues"), {
                    reporter_email: email,
                    issue_type: type,
                    description: description,
                    created_at: new Date().toISOString()
                });
                alert('Köszönjük! A probléma bejelentését elküldtük.');
                issueForm.reset();
            } catch (error) {
                alert('Hiba a bejelentés küldésekor: ' + error.message);
            }
        });
    }

    // Automatikus kezdő betöltés
    loadEvents();
    loadGallery();
});