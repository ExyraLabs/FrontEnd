import Image from "next/image";
import Link from "next/link";

const Sidebar = () => {
  const navItems = [
    {
      name: "Search",
      imgSrc: "/icons/searchs.svg",
      width: 32,
      height: 32,
    },
    {
      name: "Explore Agents",
      imgSrc: "/icons/explore.svg",
      width: 32,
      height: 32,
    },
    {
      name: "Saved Prompts",
      imgSrc: "/icons/saved.svg",
      width: 32,
      height: 32,
    },
    {
      name: "Rewards",
      imgSrc: "/icons/reward.svg",
      width: 32,
      height: 32,
    },
    {
      name: "History",
      imgSrc: "/icons/history.svg",
      width: 32,
      height: 32,
    },
  ];

  const chatHistory = [
    "Amsterdam trip with ...",
    "Amsterdam trip with ...",
    "Amsterdam trip with ...",
    "Amsterdam trip with ...",
    "Amsterdam trip with ...",
  ];

  const bottomLinks = [
    {
      name: "About Exyra",
      href: "#",
      external: true,
    },
    {
      name: "Exyra Docs",
      href: "#",
      external: true,
    },
  ];

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

  return (
    <div className="w-[18%] m-4 flex flex-1/2 flex-col rounded-[14px] bg-appGray">
      {/* New Chat Button */}
      <div className="w-full flex overflow-visible relative items-center">
        <Image
          src="/icons/marker.svg"
          alt="marker"
          width={14}
          height={47}
          className="absolute top-4 left-[1px]"
        />
        <button className="flex flex-1 justify-start px-5 items-center gap-3.5 m-6 h-[32px] rounded-[18px] bg-appDark">
          <Image
            src="/icons/edit.svg"
            alt="New"
            width={15}
            height={15}
            className=""
          />
          <p className="text-sm font-semibold">New Chat</p>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="pl-[37px]">
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <li
              key={index}
              className="flex py-1 items-center gap-3 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <Image
                src={item.imgSrc}
                alt={`${item.name} icon`}
                width={item.width}
                height={item.height}
                className=""
              />
              <span className="text-sm font-medium">{item.name}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Chat History Section */}
      <div className="flex-1 px-6 py-4">
        <div className="relative pl-6">
          {/* Custom SVG Line with Rounded Ends */}
          <svg
            className="absolute left-2 top-0 w-[1px] h-full"
            viewBox="0 0 2 200"
            preserveAspectRatio="none"
            style={{ minHeight: "200px" }}
          >
            <defs>
              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#ff6b35" stopOpacity="0" />
                <stop offset="15%" stopColor="#ff6b35" stopOpacity="1" />
                <stop offset="85%" stopColor="#ff6b35" stopOpacity="1" />
                <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width="2"
              height="200"
              fill="url(#lineGradient)"
              rx="1"
              ry="1"
            />
          </svg>

          <h3 className="text-sm font-medium text-gray-400 mb-3">Today</h3>
          <ul className="space-y-2">
            {chatHistory.map((chat, index) => (
              <li
                key={index}
                className="text-sm text-gray-300 hover:text-white cursor-pointer truncate"
              >
                {chat}
              </li>
            ))}
          </ul>
          <button className="text-sm text-gray-400 hover:text-white mt-3 underline">
            See all
          </button>
        </div>
      </div>

      {/* Bottom Links Section */}
      <div className=" bg-appDark rounded-[12px] p-4 m-6">
        <Link href={"#"} className="flex py-2 items-center">
          <p className="text-xs">About Exyra</p>
          <Image src="/icons/arrow.svg" alt="arr" width={16} height={16} />
        </Link>
        <Link href={"#"} className="flex py-2 items-center">
          <p className="text-xs">Exyra Docs</p>
          <Image src="/icons/arrow.svg" alt="arr" width={16} height={16} />
        </Link>
        <div className="flex py-2 gap-3 items-center">
          <p className="text-xs">Connect</p>
          <div className="flex gap-2 items-center">
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
  );
};

export default Sidebar;
