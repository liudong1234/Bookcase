import {useState, useEffect} from 'react';
const ReadingIndicator = ({ currentPage, totalPages }) => {
    const [bookProgress, setBookProgress] = useState(0);

    useEffect(() => {
        setBookProgress(((currentPage - 1) / totalPages) * 100);
    }, [currentPage])
    return (
        <div 
            style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                zIndex: 999
            }}
        >
            <div
                style={{
                    backgroundColor: 'rgb(53, 126, 221)',
                    height: '100%',
                    width: `${bookProgress}%`,
                    transition: 'width 0.3s ease'
                }}
            />
                      <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '12px',
              color: '#666',
              background: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >{`${currentPage} of ${totalPages} in ${Math.floor(currentPage/totalPages * 100)}%`}</span>
        </div>
    );
};

export default ReadingIndicator;