# 📸 KáTéM — Photo Gallery & Admin Web Application

A custom-built, responsive web application featuring dynamic photo gallery management, secure user authentication (Firebase Auth), and real-time database management (Cloud Firestore), deployed under a custom `.hu` domain.

🔗 **Live Demo:** [https://katem.hu](https://katem.hu)

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend & Database:** Firebase Authentication, Cloud Firestore
- **Hosting & Infrastructure:** GitHub Pages, Custom Domain DNS Configuration (`katem.hu`), SSL/TLS (HTTPS)

---

## ✨ Key Features

- 🔐 **User Authentication:** Sign up and log in powered by Firebase Auth.
- 🛡️ **Admin & Approval System:** Manual approval workflow for new user registrations using Firestore (`is_approved` document logic) and role-based admin rights.
- 🖼️ **Dynamic Gallery:** Real-time synchronization and display of uploaded imagery.
- 💬 **Issue Reporting / Contact Form:** User feedback and issue submission saved directly to dedicated Firestore collections.
- 🌐 **Custom Domain & HTTPS Setup:** Full DNS configuration (A & CNAME records) and automated SSL certificate integration via GitHub Pages.

---

## 🚀 Deployment & Engineering Challenges

During development, special focus was given to:
1. **Domain & DNS Provisioning:** Navigating registry approval, configuring A-records and CNAMEs, and establishing secure HTTPS routing through GitHub Pages.
2. **Database Security & Access Control:** Implementing Firestore Security Rules to protect user profiles, restrict unauthorized access, and ensure safe data transactions.
