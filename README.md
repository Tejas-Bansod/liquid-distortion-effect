# Liquid Distortion Effect

A beautiful, interactive water distortion effect built with Next.js, TypeScript, and WebGL. This project creates a mesmerizing liquid distortion animation that responds to user interaction.

# Check it live on [Liquid Distortion Effect](https://liquid-distortion-effect-pi.vercel.app/)

## 🎥 Demo

![Liquid Distortion Effect Demo](https://github.com/Tejas-Bansod/liquid-distortion-effect/blob/main/public/liquid.gif?raw=true)

*Interactive water distortion effect in action*

## ✨ Features

- Smooth, performant WebGL-based water distortion
- Interactive effect that responds to mouse movement
- Responsive design that works on all screen sizes
- Built with modern web technologies (Next.js 13+, TypeScript)
- Easy to customize and extend

## 🚀 Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Tejas-Bansod/liquid-distortion-effect.git
   cd liquid-distortion-effect
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠 Customization

You can customize the effect by modifying the following parameters in `app/components/Distorted_Water_Effect/DistortedWaterEffect.tsx`:

- `strength`: Controls the intensity of the distortion
- `frequency`: Adjusts the wave frequency
- `speed`: Changes the animation speed
- `blend`: Controls the blending between the original and distorted image

## 🧩 How It Works

The effect is created using WebGL shaders that manipulate the UV coordinates of the image based on noise functions. The distortion is calculated in real-time, creating the illusion of liquid movement.

## 📦 Dependencies

- Next.js 13+
- React 18+
- TypeScript
- WebGL
- GSAP (for smooth animations)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various WebGL liquid distortion effects
- Built with [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
