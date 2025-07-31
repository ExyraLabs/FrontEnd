"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChatRoomsMessages } from "../hooks/useChatRoomsMessages";
import { useState } from "react";
import {
  TextMessage,
  ActionExecutionMessage,
  ResultMessage,
  Role,
  Message,
} from "@copilotkit/runtime-client-gql";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const router = useRouter();
  const navItems = [
    {
      name: "Search",
      imgSrc: "/icons/searchs.svg",
      width: 32,
      height: 32,
      href: "/search",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <path
            d="M14.916 22.1c4.372 0 7.916-3.38 7.916-7.55S19.288 7 14.916 7 7 10.38 7 14.55s3.544 7.55 7.916 7.55zM26 25.12l-5.489-5.234"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      name: "Discover Agents",
      imgSrc: "/icons/explore.svg",
      width: 32,
      href: "/explore",
      height: 32,
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <rect x="6.5" y="6.5" width="19" height="19" rx="9.5" stroke="#fff" />
          <circle cx="13" cy="13" r="2" stroke="#D9D9D9" />
          <circle cx="19" cy="13" r="2" stroke="#D9D9D9" />
          <circle cx="13" cy="19" r="2" stroke="#D9D9D9" />
          <circle cx="19" cy="19" r="2" stroke="#D9D9D9" />
        </svg>
      ),
    },
    {
      name: "Saved Prompts",
      imgSrc: "/icons/saved.svg",
      width: 32,
      height: 32,
      href: "/saved",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M6 19.5V5.616c0-.46.154-.845.463-1.153A1.57 1.57 0 017.616 4h8.769c.46 0 .844.154 1.153.463.309.309.463.693.462 1.153V19.5l-6-2.577L6 19.5zm1-1.55l5-2.15 5 2.15V5.616a.591.591 0 00-.192-.424.584.584 0 00-.424-.192H7.616a.591.591 0 00-.424.192.584.584 0 00-.192.424V17.95z"
            fill="#fff"
          />
        </svg>
      ),
    },
    {
      name: "Rewards",
      imgSrc: "/icons/reward.min.svg",
      width: 32,
      height: 32,
      href: "/rewards",
      icon: (
        <svg
          width="24"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
        >
          <g transform="translate(5, 6)">
            <path
              d="M12 16.111a.555.555 0 00-.556-.556H8.111a.556.556 0 000 1.112h3.333A.556.556 0 0012 16.11zM12.522 13.333H9.19a.556.556 0 000 1.111h3.333a.556.556 0 000-1.11zM12.222 17.778H8.89a.555.555 0 100 1.11h3.333a.556.556 0 100-1.11zM18.167 17.778h-3.89a.556.556 0 100 1.11h3.89a.555.555 0 100-1.11zM18.722 15.556h-3.889a.556.556 0 000 1.11h3.89a.556.556 0 000-1.11z"
              fill="#fff"
            />
            <path
              d="M18.744 14.444a15.557 15.557 0 00-1.566-5.622 11.244 11.244 0 00-3.511-3.983L15 1.9a.556.556 0 00-.039-.556.555.555 0 00-.444-.233H5.444a.555.555 0 00-.505.789L6.3 4.85a11.278 11.278 0 00-3.489 3.972c-1.194 2.222-1.567 4.94-1.667 6.823A2 2 0 001.7 17.15a2.111 2.111 0 001.522.595h3.445v-1.078h-3.49a.933.933 0 01-.869-.605.9.9 0 01-.052-.368c.077-1.45.383-4.21 1.533-6.36a10 10 0 013.478-3.778h.555c-.376.52-.723 1.062-1.039 1.622-.32.596-.594 1.216-.816 1.855l.76.511c.226-.663.502-1.307.829-1.927.4-.721.855-1.41 1.36-2.061h.556c.373.89.636 1.823.784 2.777.12.709.18 1.426.177 2.145l.878-.617a13.316 13.316 0 00-.178-1.667 13.89 13.89 0 00-.71-2.638h.433l.505-1.112H7.34L6.31 2.222h7.339l-1.389 3.04c.238.127.466.272.683.432a10.333 10.333 0 013.256 3.65c.78 1.6 1.263 3.328 1.428 5.1h1.116z"
              fill="#fff"
            />
          </g>
        </svg>
      ),
    },
    // {
    //   name: "History",
    //   imgSrc: "/icons/history.min.svg",
    //   width: 32,
    //   height: 32,
    //   href: "/history",
    //   icon: (
    //     <svg
    //       width="24"
    //       height="24"
    //       fill="none"
    //       xmlns="http://www.w3.org/2000/svg"
    //       viewBox="6 6 28 28"
    //     >
    //       <g filter="url(#prefix__filter0_d_3308_4755)">
    //         <path
    //           fillRule="evenodd"
    //           clipRule="evenodd"
    //           d="M14.14 10.224c3.163-3.158 8.305-3.125 11.486.058 3.184 3.183 3.217 8.327.054 11.49-3.163 3.162-8.307 3.13-11.49-.054a8.174 8.174 0 01-2.332-6.9.625.625 0 111.24.17 6.923 6.923 0 001.975 5.847c2.704 2.703 7.057 2.72 9.724.053 2.665-2.666 2.65-7.019-.054-9.723-2.702-2.702-7.052-2.72-9.719-.057l.623.003a.624.624 0 11-.005 1.25l-2.122-.01a.625.625 0 01-.622-.623l-.01-2.12a.624.624 0 111.25-.006l.003.622zm5.767 1.817a.625.625 0 01.625.625v3.075l1.901 1.9a.626.626 0 11-.883.884l-2.267-2.267v-3.591a.625.625 0 01.625-.625"
    //           fill="#fff"
    //         />
    //       </g>
    //       <defs>
    //         <filter
    //           id="prefix__filter0_d_3308_4755"
    //           x="0"
    //           y="0"
    //           width="39.769"
    //           height="40"
    //           filterUnits="userSpaceOnUse"
    //           colorInterpolationFilters="sRGB"
    //         >
    //           <feFlood floodOpacity="0" result="BackgroundImageFix" />
    //           <feColorMatrix
    //             in="SourceAlpha"
    //             values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
    //             result="hardAlpha"
    //           />
    //           <feOffset dy="4" />
    //           <feGaussianBlur stdDeviation="2" />
    //           <feComposite in2="hardAlpha" operator="out" />
    //           <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
    //           <feBlend
    //             in2="BackgroundImageFix"
    //             result="effect1_dropShadow_3308_4755"
    //           />
    //           <feBlend
    //             in="SourceGraphic"
    //             in2="effect1_dropShadow_3308_4755"
    //             result="shape"
    //           />
    //         </filter>
    //       </defs>
    //     </svg>
    //   ),
    // },
  ];

  const { loadChatRooms, deleteChatRoom } = useChatRoomsMessages();
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const chatRoomsObj = typeof window !== "undefined" ? loadChatRooms() : {};
  const chatRooms = Object.entries(chatRoomsObj);

  const handleDelete = (chatId: string) => {
    deleteChatRoom(chatId);
    setRefresh((r) => r + 1); // force re-render
  };

  const socialLinks = [
    {
      name: "Facebook",
      href: "#",
      icon: "/icons/facebook.svg",
    },
    {
      name: "Instagram",
      href: "#",
      icon: "/icons/instagram.svg",
    },
    {
      name: "LinkedIn",
      href: "#",
      icon: "/icons/linkedin.svg",
    },
    {
      name: "Twitter",
      href: "#",
      icon: "/icons/twitter.svg",
    },
  ];

  // Mobile overlay logic
  // Sidebar is always visible on md+ screens, toggled on mobile
  return (
    <>
      {/* Overlay for mobile */}
      {typeof open === "boolean" && (
        <div
          className={`fixed inset-0 z-40 bg-opacity-40 transition-opacity md:hidden ${
            open ? "block" : "hidden"
          }`}
          onClick={onClose}
        />
      )}
      <div
        className={`m-4 flex flex-1 flex-col rounded-[14px] bg-appGray z-50 transition-transform duration-200 md:static md:translate-x-0 fixed top-0 left-0  bottom-0 w-72 md:w-auto h-auto ${
          open === undefined
            ? ""
            : open
            ? "translate-x-0"
            : "-translate-x-[120%]"
        } md:block`}
        style={{ maxWidth: "320px" }}
      >
        {/* Close button for mobile */}

        {/* New Chat Button */}
        <div className="w-full gap-3 lg:gap-0   p-6 flex overflow-visible relative items-center">
          <Image
            src="/icons/marker.svg"
            alt="marker"
            width={14}
            height={47}
            className="absolute top-4 left-[1px]"
          />
          <button
            onClick={() => {
              router.push("/");
              if (onClose) {
                onClose();
              }
            }}
            className="flex cursor-pointer flex-1 justify-start px-5 items-center gap-3.5 min-h-[42px] rounded-[18px] bg-appDark"
          >
            <Image
              src="/icons/edit.svg"
              alt="New"
              width={15}
              height={15}
              className=""
            />
            <p className="text-sm font-semibold">New Chat</p>
          </button>
          {typeof open === "boolean" && (
            <button
              className="md:hidden  z-50 p-2 rounded-full bg-white text-black"
              aria-label="Close sidebar"
              onClick={onClose}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6l8 8M6 14L14 6"
                />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col flex-1 pl-8.5">
          {/* Navigation Items */}
          <nav className="mb-3 lg:mb-6">
            <ul className="space-y-3">
              {navItems.map((item, index) => (
                // <button key={index} onClick={onClose}>
                <Link
                  className="flex py-1 items-center gap-2 rounded-lg hover:bg-gray-100 mr-2 cursor-pointer group"
                  href={item.href}
                  onClick={onClose}
                  key={index}
                >
                  <div className="w-8 h-8 flex items-center justify-center group-hover:text-appGray [&_svg_*]:group-hover:stroke-appGray [&_svg_path]:group-hover:fill-appGray">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium group-hover:text-appGray">
                    {item.name}
                  </span>
                </Link>
                // </button>
              ))}
            </ul>
          </nav>

          {/* Chat History Section */}
          <div className="relative h-max lg:mb-6 flex flex-col items-start py-2 pl-9">
            {/* Custom SVG Line with Rounded Ends */}
            {(() => {
              const gradientId = `lineGradient-${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              return (
                <svg
                  className="absolute left-3 top-0 w-[1px] h-full"
                  viewBox="0 0 2 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient
                      suppressHydrationWarning
                      id={gradientId}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-primary)"
                        stopOpacity="0"
                      />
                      <stop
                        offset="15%"
                        stopColor="var(--color-primary)"
                        stopOpacity="1"
                      />
                      <stop
                        offset="85%"
                        stopColor="var(--color-primary)"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--color-primary)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                  <rect
                    suppressHydrationWarning
                    x="0"
                    y="0"
                    width="2"
                    height="100"
                    fill={`url(#${gradientId})`}
                    rx="1"
                    ry="1"
                  />
                </svg>
              );
            })()}

            <h3 className="text-[10px] text-[#B5B5B5] mb-3">Today</h3>
            <ul className="hidden lg:flex w-[85%] flex-col gap-4">
              {chatRooms.length > 0 ? (
                chatRooms.map(([chatId, messages]) => {
                  const firstMsg: Message | null =
                    messages.length > 0 ? messages[0] : null;
                  let displayText = `Chat ${chatId}`;
                  if (firstMsg) {
                    if (
                      firstMsg.type === "TextMessage" &&
                      "content" in firstMsg
                    ) {
                      displayText = firstMsg.content as string;
                    }
                  }
                  return (
                    <li
                      key={chatId}
                      className="text-xs w-full text-white cursor-pointer truncate flex items-center duration-500 transition-all justify-between group"
                      onClick={() => router.push(`/chat/${chatId}`)}
                      onMouseEnter={() => setHoveredChatId(chatId)}
                      onMouseLeave={() => setHoveredChatId(null)}
                    >
                      <span className=" truncate">{displayText}</span>
                      {hoveredChatId === chatId && (
                        <button
                          className="duration-500 cursor-pointer hover:scale-125"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(chatId);
                          }}
                          title="Delete chat"
                        >
                          <Image
                            src="/icons/delete.svg"
                            alt="Delete"
                            width={14}
                            height={14}
                          />
                        </button>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-gray-400">No chats yet.</li>
              )}
            </ul>
            <ul className="flex lg:hidden flex-col gap-4">
              {chatRooms.length > 0 ? (
                chatRooms.slice(0, 3).map(([chatId, messages]) => {
                  const firstMsg: Message | null =
                    messages.length > 0 ? messages[0] : null;
                  let displayText = `Chat ${chatId}`;
                  if (firstMsg) {
                    if (
                      firstMsg.type === "TextMessage" &&
                      "content" in firstMsg
                    ) {
                      displayText = firstMsg.content as string;
                    }
                  }
                  return (
                    <li
                      key={chatId}
                      className="text-xs text-white cursor-pointer truncate flex items-center group"
                      onClick={() => router.push(`/chat/${chatId}`)}
                      onMouseEnter={() => setHoveredChatId(chatId)}
                      onMouseLeave={() => setHoveredChatId(null)}
                    >
                      <span className="flex-1 truncate">{displayText}</span>
                      {hoveredChatId === chatId && (
                        <button
                          className=""
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(chatId);
                          }}
                          title="Delete chat"
                        >
                          <Image
                            src="/icons/delete.svg"
                            alt="Delete"
                            width={16}
                            height={16}
                          />
                        </button>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="text-xs text-gray-400">No chats yet.</li>
              )}
            </ul>
            <button className="text-[10px] text-[#D9D9D9] hover:text-white mt-3 underline">
              See all
            </button>
          </div>

          {/* Bottom Links Section */}
          <div className=" bg-appDark absolute bottom-5 mr-6 rounded-[12px] p-4 ">
            <Link href={"#"} className="flex py-2 items-center">
              <p className="text-xs">About Exyra</p>
              <Image src="/icons/arrow.svg" alt="arr" width={20} height={20} />
            </Link>
            <Link href={"#"} className="flex py-2 items-center">
              <p className="text-xs">Exyra Docs</p>
              <Image src="/icons/arrow.svg" alt="arr" width={20} height={20} />
            </Link>
            <div className="flex py-2 gap-[29px] items-center">
              <p className="text-xs">Connect</p>
              <div className="flex gap-3   items-center">
                {socialLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={link.href}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Image
                      src={link.icon}
                      alt={`${link.name} icon`}
                      width={14}
                      height={14}
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
