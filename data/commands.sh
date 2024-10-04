conda create -n autotrain python=3.10
conda activate autotrain
pip install autotrain-advanced
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia
conda install -c "nvidia/label/cuda-12.1.0" cuda-nvcc

autotrain app --port 8080 --host 127.0.0.1

export HF_TOKEN=hf_
