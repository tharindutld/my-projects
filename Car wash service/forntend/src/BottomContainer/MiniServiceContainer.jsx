import React from 'react';


const MiniServiceContainer = (props) => {

    return(
        <div>
            <div className="container-box">
                    <div className="bottom-container-box-one">
                        <img src={props.image} alt={props.title} />
                        <div className="box-one">
                            <h5>{props.title}</h5>
                            <p>{props.description}</p>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default MiniServiceContainer;