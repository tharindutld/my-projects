import React from 'react';
import MiniServiceContainer from './MiniServiceContainer';
import carWash from '../images/car-wash.png';
import carService from '../images/car-servicing.png';
import carCheckingUp from '../images/car-checkup.png';
import carPainting from '../images/car-painting.png';
import carModifying from '../images/car-modify.png';
import wheelAlighnment from '../images/wheels.png';


const MiniServiceContainerDetails = () => {
  return (
    <div className='mini-service-container'>
      <div className='mini-service-container-one'>
        <MiniServiceContainer
            image={carWash}
            title="Car Wash"
            description="Our professional car wash service ensures your vehicle looks brand new. We meticulously clean both the exterior and interior, removing dirt, dust, and grime, to restore your car’s original shine, leaving it fresh and spotless"
        />

        <MiniServiceContainer
            image={carModifying}
            title="Car Modifying"
            description="Transform your vehicle with our custom car modification services. From performance enhancements to aesthetic upgrades, we provide tailored solutions to enhance both style and functionality, giving your car a unique look and feel that suits your needs."
        />
     </div>

     <div className='mini-service-container-one'>
        <MiniServiceContainer
            image={carCheckingUp}
            title="Car Checking-Up"
            description="Keep your vehicle in top condition with our comprehensive car check-up. We thoroughly inspect key components, including brakes, tires, fluids, and engine health, to detect potential issues early, ensuring safety and preventing costly repairs"
        />

        <MiniServiceContainer
            image={carPainting}
            title="Car Painting"
            description="Restore your car’s beauty with our expert car painting services. Whether it's a full-body repaint or touch-ups, we use premium paints and precision techniques to give your vehicle a vibrant, flawless finish that lasts."
        />
      </div>

      <div className='mini-service-container-one'>
        
        <MiniServiceContainer
            image={carService}
            title="Car Service"
            description="Our car service covers all essential maintenance tasks, including oil changes, filter replacements, and system checks. We ensure your vehicle runs smoothly, optimally, and safely, maximizing its lifespan and improving overall performance for hassle-free driving."
        />

        <MiniServiceContainer
            image={wheelAlighnment}
            title="Wheel Alignment"
            description="Improve your vehicle’s handling and tire lifespan with our precise wheel alignment service. We adjust your suspension system to manufacturer standards, ensuring a smoother ride, better fuel efficiency, and enhanced safety on the road"
        />
      </div>
        
    </div>

    
  )
}

export default MiniServiceContainerDetails;
