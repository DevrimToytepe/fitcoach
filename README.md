# FitCoach - React Native App

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start

# iOS
npm run ios

# Android
npm run android
```

## Test Hesapları

| Tip    | E-posta          | Şifre  |
|--------|------------------|--------|
| Sporcu | ali@test.com     | 123456 |
| PT     | ahmet@test.com   | 123456 |

## Özellikler

### Sporcu
- PT keşfet ve filtrele (uzmanlık, fiyat, müsaitlik)
- PT profili görüntüle (bio, galeri, yorumlar)
- Koçluk talebi gönder
- Koçunla mesajlaş
- Kişisel notlar tut

### PT
- Dashboard (öğrenci yönetimi, bekleyen talepler)
- Koçluk taleplerini kabul/reddet
- Galeri yönetimi (before/after)
- Öğrencilerle mesajlaş
- Profil düzenleme

## Teknik Stack

- React Native (Expo SDK 51)
- TypeScript (strict mode)
- React Navigation v6
- Zustand (state management)
- React Hook Form + Zod (validation)
- AsyncStorage (persistence)
- React Native Reanimated 3 (animations)
- date-fns (date utilities)
- uuid (ID generation)

## Proje Yapısı

```
src/
├── components/     # Reusable UI components
│   ├── common/     # Button, Input, Card, Badge, Avatar, Loading, Toast
│   ├── pt/         # PTCard, PTProfileHeader, GalleryGrid, StudentList
│   ├── athlete/    # GoalSelector, FilterBar, BookingCard
│   └── messaging/  # MessageBubble, ConversationCard, ChatInput
├── screens/        # App screens
│   ├── onboarding/ # Splash, Onboarding, UserType
│   ├── auth/       # Login, Register (Athlete/PT), ForgotPassword
│   ├── athlete/    # Home, Explore, PTProfile, MyCoach, Profile
│   ├── pt/         # Dashboard, EditProfile, GalleryManager, Profile
│   ├── messaging/  # Conversations, Chat
│   └── shared/     # Notifications
├── navigation/     # Navigator components
├── store/          # Zustand stores
├── types/          # TypeScript types
├── utils/          # Helpers, mock data, storage
└── constants/      # Colors, typography
```
