import Image from "next/image";

const Logo = () => {
  return (
    <div className="flex mr-auto lg:bg-[#212121] rounded-[14px] py-[13px] pl-[17px] pr-[29px] items-center gap-2">
      <Image src="/icons/exyra.svg" alt="Logo" width={17} height={17} />
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
