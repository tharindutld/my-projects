import React, { useState } from 'react';
import BottomContainer from './BottomContainer';
import MiddleContainer from './MiddleContainer';
import UpperContainer from './UpperContainer';

const BottomContainerButtons = () => {

  const [result, setResult] = useState('');
  const [display, setDisplay] = useState('');


  const appendToDisplay = (value) => {
    setDisplay( prev => prev + value);
  };

  const clearDisplay = () => {
    setDisplay('');
    setResult('');
  };

  const calculate = () => {
    try {
      const evalResult = eval(display).toString();
      setResult(evalResult); 
      
    } catch {
      setResult('Error');
    }
  };

  const deleteLast = () => {
    setDisplay(display.slice(0, -1));
  }

  const toggleSign = () => {
    if(display) {
      if(display.charAt(0) === '-'){
        setDisplay(display.slice(1))
      }else {
        setDisplay('-' + display);
      }
    }
  }

  const handlePercent = () => {
    try {
      const value = eval(display);
      setDisplay((value / 100).toString());
    } catch (error) {
      setDisplay('Error');
    }
  };

  return (
     
    <div>
        <UpperContainer result={result} />
        <MiddleContainer display={display}/>
        

        <div className='bottom-container-buttons'>

          <div className='buttons-first-row'>
            <button onClick={handlePercent} ><BottomContainer sign="%"/></button>
            <button onClick={clearDisplay}><BottomContainer sign="C"/></button>
            <button onClick={deleteLast} ><BottomContainer sign="⟵"/></button>
            <button onClick={() => appendToDisplay('/')} className='arithmetic-operators'><BottomContainer sign="÷"/></button>
          </div>

          <div className='buttons-second-row'>
            <button onClick={() => appendToDisplay('7')} className='number-buttons'><BottomContainer sign="7"/></button>
            <button onClick={() => appendToDisplay('8')} className='number-buttons'><BottomContainer sign="8"/></button>
            <button onClick={() => appendToDisplay('9')} className='number-buttons'><BottomContainer sign="9"/></button>
            <button onClick={() => appendToDisplay('*')} className='arithmetic-operators'><BottomContainer sign="×"/></button>
          </div>

          <div className='buttons-third-row'>
            <button onClick={() => appendToDisplay('4')} className='number-buttons'><BottomContainer sign="4"/></button>
            <button onClick={() => appendToDisplay('5')} className='number-buttons'><BottomContainer sign="5"/></button>
            <button onClick={() => appendToDisplay('6')} className='number-buttons'><BottomContainer sign="6"/></button>
            <button onClick={() => appendToDisplay('-')} className='arithmetic-operators'><BottomContainer sign="-"/></button>
          </div>

          <div className='buttons-fourth-row'>
            <button onClick={() => appendToDisplay('1')} className='number-buttons'><BottomContainer sign="1"/></button>
            <button onClick={() => appendToDisplay('2')} className='number-buttons'><BottomContainer sign="2"/></button>
            <button onClick={() => appendToDisplay('3')} className='number-buttons'><BottomContainer sign="3"/></button>
            <button onClick={() => appendToDisplay('+')} className='arithmetic-operators'><BottomContainer sign="+"/></button>
          </div>

          <div className='buttons-fifth-row'>
            <button onClick={toggleSign} ><BottomContainer sign="+/-"/></button>
            <button onClick={() => appendToDisplay('0')} className='number-buttons'><BottomContainer sign="0"/></button>
            <button onClick={() => appendToDisplay('.')} ><BottomContainer sign="."/></button>
            <button onClick={calculate} className='equal-operators'><BottomContainer sign="="/></button>
          </div>
      
      </div>
    </div>

    
  )
}

export default BottomContainerButtons;
