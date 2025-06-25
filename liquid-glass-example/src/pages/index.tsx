import { Geist } from 'next/font/google';
import { useState, useRef } from 'react';
import LiquidGlass from '@nkzw/liquid-glass';
import { LogOutIcon, Github } from 'lucide-react';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export default function Home() {
  // User Info Card Controls
  const [displacementScale, setDisplacementScale] = useState(100);
  const [blurAmount, setBlurAmount] = useState(0.5);
  const [saturation, setSaturation] = useState(140);
  const [aberrationIntensity, setAberrationIntensity] = useState(2);
  const [elasticity, setElasticity] = useState(0);
  const [cornerRadius, setCornerRadius] = useState(32);
  const [userInfoOverLight, setUserInfoOverLight] = useState(false);
  const [userInfoMode, setUserInfoMode] = useState<
    'standard' | 'polar' | 'prominent' | 'shader'
  >('standard');

  // Log Out Button Controls
  const [logoutDisplacementScale, setLogoutDisplacementScale] = useState(64);
  const [logoutBlurAmount, setLogoutBlurAmount] = useState(0.1);
  const [logoutSaturation, setLogoutSaturation] = useState(130);
  const [logoutAberrationIntensity, setLogoutAberrationIntensity] = useState(2);
  const [logoutElasticity, setLogoutElasticity] = useState(0.35);
  const [logoutCornerRadius, setLogoutCornerRadius] = useState(100);
  const [logoutOverLight, setLogoutOverLight] = useState(false);
  const [logoutMode, setLogoutMode] = useState<
    'standard' | 'polar' | 'prominent' | 'shader'
  >('standard');

  // Shared state
  const [activeTab, setActiveTab] = useState<'userInfo' | 'logOut'>('userInfo');
  const containerRef = useRef<HTMLDivElement>(null);

  const [scroll, setScroll] = useState(0);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      const scrollTop = (
        event?.target as unknown as { scrollTop: number } | null
      )?.scrollTop;
      if (scrollTop != null) {
        setScroll(scrollTop);
      }
    });
  };

  const scrollingOverBrightSection = scroll > 230 && scroll < 500;

  return (
    <div
      className={`${geistSans.className} grid grid-cols-1 grid-rows-2 md:grid-rows-1 md:grid-cols-3 shadow-2xl w-full max-w-5xl mx-auto md:my-10 h-screen md:max-h-[calc(100vh-5rem)] md:rounded-3xl overflow-hidden font-[family-name:var(--font-geist-sans)]`}
    >
      {/* Left Panel - Glass Effect Demo */}
      <div
        className="flex-1 relative overflow-auto min-h-screen md:col-span-2"
        onScroll={handleScroll}
        ref={containerRef}
      >
        <div className="w-full min-h-[200vh] absolute top-0 left-0 pb-96 mb-96">
          <img
            className="w-full h-96 object-cover"
            src="https://picsum.photos/2000/2000"
          />
          <div className="flex flex-col gap-2" id="bright-section">
            <h2 className="text-2xl font-semibold my-5 text-center">
              Some Heading
            </h2>
            <p className="px-10">
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger{' '}
              <br />
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger
              <br />
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger
              <br />
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger
              <br />
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger
              <br />
              Bacon ipsum dolor amet hamburger Bacon ipsum dolor amet hamburger
            </p>
          </div>
          <img
            className="w-full h-80 object-cover my-10"
            src="https://picsum.photos/1200/1200"
          />
          <img
            className="w-full h-72 object-cover my-10"
            src="https://picsum.photos/1400/1300"
          />
          <img
            className="w-full h-96 object-cover my-10 mb-96"
            src="https://picsum.photos/1100/1200"
          />
        </div>

        {activeTab === 'userInfo' && (
          <LiquidGlass
            aberrationIntensity={aberrationIntensity}
            blurAmount={blurAmount}
            cornerRadius={cornerRadius}
            displacementScale={displacementScale}
            elasticity={elasticity}
            mode={userInfoMode}
            mouseContainer={containerRef}
            overLight={scrollingOverBrightSection || userInfoOverLight}
            saturation={saturation}
            style={{
              left: 300,
              position: 'fixed',
              top: 200,
            }}
          >
            <div className="w-72 text-shadow-lg">
              <h3 className="text-xl font-semibold mb-4">User Info</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-black/10 backdrop-blur rounded-full flex items-center justify-center text-white font-semibold">
                    JD
                  </div>
                  <div>
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-white">Software Engineer</p>
                  </div>
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Email:</span>
                    <span className="text-sm">john.doe@example.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Location:</span>
                    <span className="text-sm">San Francisco, CA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white">Joined:</span>
                    <span className="text-sm">March 2023</span>
                  </div>
                </div>
              </div>
            </div>
          </LiquidGlass>
        )}

        {activeTab === 'logOut' && (
          <LiquidGlass
            aberrationIntensity={logoutAberrationIntensity}
            blurAmount={logoutBlurAmount}
            cornerRadius={logoutCornerRadius}
            displacementScale={logoutDisplacementScale}
            elasticity={logoutElasticity}
            mode={logoutMode}
            mouseContainer={containerRef}
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log('Logged out');
            }}
            overLight={scrollingOverBrightSection || logoutOverLight}
            padding="8px 16px"
            saturation={logoutSaturation}
            style={{
              left: '40%',
              position: 'fixed',
              top: '20%',
            }}
          >
            <h3 className="text-lg font-medium flex items-center gap-2">
              Log Out
              <LogOutIcon className="w-5 h-5" />
            </h3>
          </LiquidGlass>
        )}
      </div>

      {/* Right Panel - Control Panel */}
      <div className="row-start-2 rounded-t-3xl md:rounded-none md:col-start-3 bg-gray-900/80 h-full overflow-y-auto backdrop-blur-md border-l border-white/10 p-8 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">
              Glassy Boi but Web
            </h2>
            <a
              className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              href="https://github.com/rdev/liquid-glass-react"
              rel="noopener noreferrer"
              target="_blank"
              title="View on GitHub"
            >
              <Github className="w-6 h-6" />
            </a>
          </div>
          <p className="text-white/60 text-sm">
            Liquid Glass container effect for React. With settings and effects
            and stuff.
          </p>

          <p className="font-semibold text-yellow-300 text-xs mt-2 leading-snug">
            ⚠️ This doesn&apos;t fully work in Safari and Firefox. You will not
            see edge refraction on non-chromium browsers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-6 bg-white/5 rounded-lg p-1">
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'userInfo' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            onClick={() => setActiveTab('userInfo')}
          >
            User Info Card
          </button>
          <button
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'logOut' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            onClick={() => setActiveTab('logOut')}
          >
            Log Out Button
          </button>
        </div>

        <div className="space-y-8 flex-1">
          {activeTab === 'userInfo' && (
            <>
              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Refraction Mode
                </span>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      checked={userInfoMode === 'standard'}
                      className="w-4 h-4 accent-blue-500"
                      id="userInfoModeStandard"
                      name="userInfoMode"
                      onChange={(e) =>
                        setUserInfoMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="standard"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="userInfoModeStandard"
                    >
                      Standard
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={userInfoMode === 'polar'}
                      className="w-4 h-4 accent-blue-500"
                      id="userInfoModePolar"
                      name="userInfoMode"
                      onChange={(e) =>
                        setUserInfoMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="polar"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="userInfoModePolar"
                    >
                      Polar
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={userInfoMode === 'prominent'}
                      className="w-4 h-4 accent-blue-500"
                      id="userInfoModeProminent"
                      name="userInfoMode"
                      onChange={(e) =>
                        setUserInfoMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="prominent"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="userInfoModeProminent"
                    >
                      Prominent
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={userInfoMode === 'shader'}
                      className="w-4 h-4 accent-blue-500"
                      id="userInfoModeShader"
                      name="userInfoMode"
                      onChange={(e) =>
                        setUserInfoMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="shader"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="userInfoModeShader"
                    >
                      Shader (Experimental)
                    </label>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Controls the refraction calculation method
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Displacement Scale
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-blue-300">
                    {displacementScale}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="200"
                  min="0"
                  onChange={(e) => setDisplacementScale(Number(e.target.value))}
                  step="1"
                  type="range"
                  value={displacementScale}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls the intensity of edge distortion
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Blur Amount
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-green-300">
                    {blurAmount.toFixed(1)}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="1"
                  min="0"
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  step="0.01"
                  type="range"
                  value={blurAmount}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls backdrop blur intensity
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Saturation
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-purple-300">
                    {saturation}%
                  </span>
                </div>
                <input
                  className="w-full"
                  max="300"
                  min="100"
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  step="10"
                  type="range"
                  value={saturation}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls color saturation of the backdrop
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Chromatic Aberration
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-cyan-300">
                    {aberrationIntensity}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="20"
                  min="0"
                  onChange={(e) =>
                    setAberrationIntensity(Number(e.target.value))
                  }
                  step="1"
                  type="range"
                  value={aberrationIntensity}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls RGB channel separation intensity
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Elasticity
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-orange-300">
                    {elasticity.toFixed(2)}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="1"
                  min="0"
                  onChange={(e) => setElasticity(Number(e.target.value))}
                  step="0.05"
                  type="range"
                  value={elasticity}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls how much the glass reaches toward the cursor
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Corner Radius
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-pink-300">
                    {cornerRadius === 999 ? 'Full' : `${cornerRadius}px`}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="100"
                  min="0"
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  step="1"
                  type="range"
                  value={cornerRadius}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls the roundness of the glass corners
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Over Light
                </span>
                <div className="flex items-center space-x-3">
                  <input
                    checked={userInfoOverLight}
                    className="w-5 h-5 accent-blue-500"
                    id="userInfoOverLight"
                    onChange={(e) => setUserInfoOverLight(e.target.checked)}
                    type="checkbox"
                  />
                  <label
                    className="text-sm text-white/90"
                    htmlFor="userInfoOverLight"
                  >
                    Tint liquid glass dark (use for bright backgrounds)
                  </label>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Makes the glass darker for better visibility on light
                  backgrounds
                </p>
              </div>
            </>
          )}

          {activeTab === 'logOut' && (
            <>
              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Refraction Mode
                </span>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <input
                      checked={logoutMode === 'standard'}
                      className="w-4 h-4 accent-blue-500"
                      id="logoutModeStandard"
                      name="logoutMode"
                      onChange={(e) =>
                        setLogoutMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="standard"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="logoutModeStandard"
                    >
                      Standard
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={logoutMode === 'polar'}
                      className="w-4 h-4 accent-blue-500"
                      id="logoutModePolar"
                      name="logoutMode"
                      onChange={(e) =>
                        setLogoutMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="polar"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="logoutModePolar"
                    >
                      Polar
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={logoutMode === 'prominent'}
                      className="w-4 h-4 accent-blue-500"
                      id="logoutModeProminent"
                      name="logoutMode"
                      onChange={(e) =>
                        setLogoutMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="prominent"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="logoutModeProminent"
                    >
                      Prominent
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      checked={logoutMode === 'shader'}
                      className="w-4 h-4 accent-blue-500"
                      id="logoutModeShader"
                      name="logoutMode"
                      onChange={(e) =>
                        setLogoutMode(
                          e.target.value as
                            | 'standard'
                            | 'polar'
                            | 'prominent'
                            | 'shader',
                        )
                      }
                      type="radio"
                      value="shader"
                    />
                    <label
                      className="text-sm text-white/90"
                      htmlFor="logoutModeShader"
                    >
                      Shader
                    </label>
                  </div>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Controls the refraction calculation method
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Displacement Scale
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-blue-300">
                    {logoutDisplacementScale}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="200"
                  min="0"
                  onChange={(e) =>
                    setLogoutDisplacementScale(Number(e.target.value))
                  }
                  step="1"
                  type="range"
                  value={logoutDisplacementScale}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls the intensity of edge distortion
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Blur Amount
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-green-300">
                    {logoutBlurAmount.toFixed(1)}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="1"
                  min="0"
                  onChange={(e) => setLogoutBlurAmount(Number(e.target.value))}
                  step="0.01"
                  type="range"
                  value={logoutBlurAmount}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls backdrop blur intensity
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Saturation
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-purple-300">
                    {logoutSaturation}%
                  </span>
                </div>
                <input
                  className="w-full"
                  max="300"
                  min="100"
                  onChange={(e) => setLogoutSaturation(Number(e.target.value))}
                  step="10"
                  type="range"
                  value={logoutSaturation}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls color saturation of the backdrop
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Chromatic Aberration
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-cyan-300">
                    {logoutAberrationIntensity}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="20"
                  min="0"
                  onChange={(e) =>
                    setLogoutAberrationIntensity(Number(e.target.value))
                  }
                  step="1"
                  type="range"
                  value={logoutAberrationIntensity}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls RGB channel separation intensity
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Elasticity
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-orange-300">
                    {logoutElasticity.toFixed(2)}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="1"
                  min="0"
                  onChange={(e) => setLogoutElasticity(Number(e.target.value))}
                  step="0.05"
                  type="range"
                  value={logoutElasticity}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls how much the glass reaches toward the cursor
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Corner Radius
                </span>
                <div className="mb-2">
                  <span className="text-xl font-mono text-pink-300">
                    {logoutCornerRadius === 999
                      ? 'Full'
                      : `${logoutCornerRadius}px`}
                  </span>
                </div>
                <input
                  className="w-full"
                  max="100"
                  min="0"
                  onChange={(e) =>
                    setLogoutCornerRadius(Number(e.target.value))
                  }
                  step="1"
                  type="range"
                  value={logoutCornerRadius}
                />
                <p className="text-xs text-white/50 mt-2">
                  Controls the roundness of the glass corners
                </p>
              </div>

              <div>
                <span className="block text-sm font-semibold text-white/90 mb-3">
                  Over Light
                </span>
                <div className="flex items-center space-x-3">
                  <input
                    checked={logoutOverLight}
                    className="w-5 h-5 accent-blue-500"
                    id="logoutOverLight"
                    onChange={(e) => setLogoutOverLight(e.target.checked)}
                    type="checkbox"
                  />
                  <label
                    className="text-sm text-white/90"
                    htmlFor="logoutOverLight"
                  >
                    Tint liquid glass dark (use for bright backgrounds)
                  </label>
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Makes the glass darker for better visibility on light
                  backgrounds
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
