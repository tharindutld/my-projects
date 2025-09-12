import React from 'react';


const MiddleContainer = ({display}) => {


    return(
        <div className='middle-container'>
            <input type="text" id='display' value={display} readOnly/>
        </div>
    )
}

export default MiddleContainer;