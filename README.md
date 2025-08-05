
# MyRecyclingApp

# 1. Description

MyRecyclingApp is a mobile application designed to promote recycling awareness and simplify eco-friendly actions. It enables users to:

- Find nearby recycling points on an interactive map  
- Scan product barcodes to check recyclability via the Open Food Facts API  
- Join daily and weekly eco-challenges with progress tracking and streaks  
- Earn badges and redeemable rewards  
- Chat in real time with other users about challenges  
- Receive push notifications for reminders, achievements, and updates  
- Switch between light and dark mode for best viewing comfort  

---

# 2. Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB Atlas  
- **Frontend:** React Native (Expo)  
- **Authentication:** JWT (JSON Web Tokens)  
- **Notifications:** Expo Notifications & Push API  
- **Real-Time:** Socket.IO  
- **Cloud Storage:** Cloudinary (profile images)  
- **APIs:** Open Food Facts (barcode data), Expo Location API  

---

# 3. Features

1. **User Management**  
   - Register, log in, and manage profile  
   - Role-based (user, admin) dashboards  

2. **Recycling Points Map**  
   - Geolocation-based listing of recycling centers  
   - Distance calculation from current location  

3. **Barcode Scanner**  
   - Scan product barcodes to fetch recyclability info  

4. **Eco-Challenges**  
   - Browse and join challenges  
   - Track daily/weekly progress and streaks  

5. **Rewards System**  
   - Earn badges and points  
   - Redeem rewards in-app  

6. **Community Chat**  
   - Real-time chat rooms per challenge  

7. **Push Notifications**  
   - Reminders for challenges  
   - Achievement alerts  

8. **Dark Mode**  
   - Toggle between light and dark themes  

---

# 4. Installation & Setup

# 4.1 Clone the Repository

```bash
git clone https://github.com/perpetual-isaiah/rethink-recycleapp.git
cd rethink-recycleapp
````

# 4.2 Backend Setup

```bash
cd backend
npm install
```

1. Copy `.env.example` to `.env` and fill in your values:

   * `MONGODB_URI`
   * `JWT_SECRET`
   * `CLOUDINARY_CLOUD_NAME`
   * `CLOUDINARY_API_KEY`
   * `CLOUDINARY_API_SECRET`

2. Start the server:

```bash
npm start
```

# 4.3 Frontend Setup

```bash
cd ../frontend
npm install
```

1. Open `config.js` and set `API_BASE_URL` to your backend URL.
2. Start Expo:

```bash
expo start
```

# 4.4 Environment Variables Example

```ini
# backend/.env.example
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/myrecyclingapp
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

# 5. API Documentation

* **Postman Collection:**
  
  https://lively-crater-77241.postman.co/workspace/Recycling-Awareness-App-API-Wor~cc97a8ad-6f6b-4372-a4e0-f0d0bed48774/collection/36770175-7d7eb8a5-6f3a-40f3-89c4-ada308400e7f?action=share&source=copy-link&creator=36770175

### Key Endpoints

| Method | Endpoint                | Description                       |
| ------ | ----------------------- | --------------------------------- |
| POST   | `/api/auth/register`    | Register a new user               |
| POST   | `/api/auth/login`       | Log in and receive a JWT          |
| GET    | `/api/recycling-points` | List nearby recycling locations   |
| POST   | `/api/barcode/scan`     | Scan barcode for recyclability    |
| GET    | `/api/challenges`       | List available challenges         |
| POST   | `/api/user-challenges`  | Join or submit challenge progress |
| GET    | `/api/notifications`    | Fetch user notifications          |

---

# 6. Live Demo

* **Expo App Preview:** [https://expo.dev/@your-username/myrecyclingapp](https://expo.dev/@your-username/myrecyclingapp)
* **Demo Video:** [https://youtu.be/your-demo-link](https://youtu.be/your-demo-link)

---

# 7. Screenshots

| Home Screen                   | Barcode Scanner               | Map Screen                  |
| ----------------------------- | ----------------------------- | --------------------------- |
| ![Home](screenshots/home.png) | ![Scan](screenshots/scan.png) | ![Map](screenshots/map.png) |

| Challenges & Rewards                     | Community Chat                |
| ---------------------------------------- | ----------------------------- |
| ![Challenges](screenshots/challenge.png) | ![Chat](screenshots/chat.png) |

---

# 8. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

*MyRecyclingApp – Making sustainability simple, social, and fun!*


