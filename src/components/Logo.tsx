const Logo = () => {
  return (
    <div className="flex mr-auto lg:bg-[#212121] rounded-[14px] py-[13px] pl-[17px] pr-[29px] items-center gap-2">
      <span className="text-primary">
        <svg
          width="19"
          height="18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 8.991c-4.693 0-8.491 3.816-8.491 8.509 0-4.693-3.816-8.509-8.509-8.509 4.693 0 8.509-3.798 8.509-8.491A8.486 8.486 0 0018 8.991z"
            fill="currentColor"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h5
        style={{ fontFamily: 'Helvetica, "Helvetica Neue", Arial, sans-serif' }}
        className="text-[#B5B5B5] uppercase"
      >
        Exyra
      </h5>
    </div>
  );
};

export default Logo;
